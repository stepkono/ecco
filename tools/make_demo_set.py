"""Build the curated clips for the scripted end-to-end demo, verified against the real model.

    python -m tools.make_demo_set                 # writes data/demo/before, data/demo/after, manifest.json

The scenario (plan, Phase 4):
  1. clip A, an unknown species (crickets), plays: the device needs help and queues it
  2. a player labels it                                 3. new prototypes reach the device
  4. clip A and A2 (another recording of the same species) are now recognized
  5. a rain clip raises a false alarm, is labelled as noise, and the alarm disappears

Clips come from ESC-50 recordings that were not used for the device prototypes.
Every candidate is checked with the same model, prototypes and decision rules the
device uses: A, A2 and the rain clip must start as "needs help", and after learning
from A (as crickets) and the rain clip (as noise) A and A2 must be recognized as
crickets and the rain clip must be quiet. Fillers (frog, birds) must stay recognized.
"""

from __future__ import annotations

import argparse
import itertools
import json
from pathlib import Path

from bench.batch import recording_id, scan_folder
from core.audio import load_audio, save_wav
from core.config import ROOT, data_path, load_config
from core.heads import PrototypeHead
from core.models import build_registry
from core.pipeline import analyze
from core.state import is_noise, state_for

SR = 48000


class Judge:
    """The device's decision rules, applied to a prototype head."""

    def __init__(self, cfg: dict) -> None:
        self.cfg = cfg
        dev = cfg["device"]
        self.model = build_registry(threads=cfg["runtime"]["threads"]).get(dev["model_id"])
        h = cfg["head"]
        self.t_known = float(h.get("t_known_by_model", {}).get(self.model.model_id, h["t_known"]))
        self.margin, self.t_noise, self.noise = float(h["margin"]), float(h.get("t_noise", 1.0)), h["noise_label"]
        self._emb: dict[Path, object] = {}

    def embed(self, path: Path):
        if path not in self._emb:
            x, sr = load_audio(path, SR)
            self._emb[path] = analyze(self.model, x, sr, energy_dbfs=self.cfg["gates"]["energy_dbfs"]).clip_embedding()
        return self._emb[path]

    def state(self, head: PrototypeHead, path: Path):
        d = head.predict(self.embed(path), self.t_known, self.margin)
        if not d.recognized and is_noise(d.best_label, self.noise) and d.best >= self.t_noise and d.margin >= self.margin:
            d.label = d.best_label
        return state_for(True, False, d, self.noise), d


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--folder", default=str(ROOT / "data" / "esc50"))
    ap.add_argument("--out", default=str(ROOT / "data" / "demo"))
    ap.add_argument("--species", default="crickets")
    ap.add_argument("--false-alarm", default="rain,water_drops,thunderstorm,sea_waves")
    a = ap.parse_args()
    cfg = load_config()
    judge = Judge(cfg)
    m = judge.model
    seed = PrototypeHead(m.model_id, m.model_version, m.embedding_dim)
    seed_file = data_path("prototypes") / f"{m.model_id}.prototype.json"
    seed.import_json(seed_file.read_text(encoding="utf-8"))
    used_file = data_path("prototypes") / f"{m.model_id}.used.json"
    used = {cls: {r.split(":")[-1] for r in recs} for cls, recs in json.loads(used_file.read_text()).items()}
    files = scan_folder(a.folder)
    fresh = lambda cls: [p for p in files.get(cls, []) if recording_id(p).split(":")[-1] not in used.get(cls, set())]  # noqa: E731

    def one_per_recording(paths):
        seen, out = set(), []
        for p in paths:
            r = recording_id(p)
            if r not in seen:
                seen.add(r)
                out.append(p)
        return out

    # unknown species: must need help before learning
    cands = [p for p in one_per_recording(fresh(a.species)) if judge.state(seed, p)[0].kind.value == "needs_help"]
    alarms = [p for c in a.false_alarm.split(",") for p in one_per_recording(fresh(c))
              if judge.state(seed, p)[0].kind.value == "needs_help"]
    fillers = {c: next(p for p in fresh(c) if judge.state(seed, p)[0].label == c) for c in ("frog", "chirping_birds")}
    print(f"{len(cands)} {a.species} candidates and {len(alarms)} false-alarm candidates need help with the seed prototypes")

    best = None
    for A, A2 in itertools.permutations(cands, 2):
        h1 = PrototypeHead(m.model_id, m.model_version, m.embedding_dim)
        h1.import_json(seed.export_json())
        h1.add_example(a.species, judge.embed(A))
        sa, da = judge.state(h1, A)
        sa2, da2 = judge.state(h1, A2)
        if sa.label != a.species or sa2.label != a.species:
            continue
        for R in alarms:
            h2 = PrototypeHead(m.model_id, m.model_version, m.embedding_dim)
            h2.import_json(h1.export_json())
            h2.add_example(judge.noise, judge.embed(R))
            checks = [judge.state(h2, A)[0].label == a.species, judge.state(h2, A2)[0].label == a.species,
                      judge.state(h2, R)[0].kind.value == "quiet",
                      all(judge.state(h2, f)[0].label == c for c, f in fillers.items())]
            if all(checks):
                score = min(da2.best - judge.t_known, da2.margin)  # how safely A2 is recognized
                if best is None or score > best[0]:
                    best = (score, A, A2, R, da2.best)
            break_early = best is not None and best[0] > 0.05
            if break_early:
                break
        if best is not None and best[0] > 0.05:
            break
    if best is None:
        raise SystemExit("no clip combination passes all checks: try other --species or --false-alarm classes")
    _, A, A2, R, a2_sim = best
    out = Path(a.out)
    plan = {
        "before": [("01_unknown_A.wav", A, "needs_help", None), ("02_frog.wav", fillers["frog"], "recognized", "frog"),
                   ("03_rain_false_alarm.wav", R, "needs_help", None),
                   ("04_birds.wav", fillers["chirping_birds"], "recognized", "chirping_birds")],
        "after": [("01_unknown_A.wav", A, "recognized", a.species), ("02_same_species_A2.wav", A2, "recognized", a.species),
                  ("03_rain_false_alarm.wav", R, "quiet", None)],
    }
    manifest = {"species": a.species, "noise_label": judge.noise, "clip_A": A.name, "clip_A2": A2.name, "rain": R.name,
                "a2_similarity_after_learning": round(float(a2_sim), 3), "playlists": {}}
    for phase, items in plan.items():
        d = out / phase
        d.mkdir(parents=True, exist_ok=True)
        for old in d.glob("*.wav"):
            old.unlink()
        manifest["playlists"][phase] = []
        for name, src, state, label in items:
            x, _ = load_audio(src, SR)
            save_wav(d / name, x[: 5 * SR], SR)
            manifest["playlists"][phase].append({"file": name, "source": src.name, "expect": state, "label": label})
            print(f"{phase:6s} {name:28s} from {src.name:22s} expect {state} {label or ''}")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"A2 is recognized at similarity {a2_sim:.2f} (T_known {judge.t_known:.2f}) after learning from A only")


if __name__ == "__main__":
    main()
