"""Find a sensible T_known (recognition threshold) per model from labelled data.

    python -m tools.calibrate_threshold --model yamnet-tflite --folder data/esc50 --shots 5

Builds prototypes from `shots` examples per class (train and test never share a
recording), then sweeps T_known and reports, for each value:

* known_ok:       test clips of known classes recognized as the right class
* known_unknown:  test clips of known classes wrongly flagged "needs help"
* novel_unknown:  clips of a held-out class correctly flagged "needs help"
* novel_wrong:    clips of a held-out class wrongly recognized as something

The suggested value maximises known_ok + novel_unknown. Embeddings are cached
in data/cache so re-runs are instant.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from bench.batch import _split, scan_folder
from core.audio import load_audio
from core.config import ROOT, load_config
from core.heads import PrototypeHead, decide
from core.models import build_registry
from core.pipeline import analyze


def embeddings(model_id: str, folder: Path) -> tuple[dict[str, list[Path]], dict[Path, np.ndarray]]:
    files = scan_folder(folder)
    cache = ROOT / "data" / "cache" / f"{folder.name}_{model_id}.npz"
    if cache.exists():
        d = np.load(cache, allow_pickle=True)
        emb = {Path(p): e for p, e in zip(d["paths"], d["emb"])}
        if all(p in emb for ps in files.values() for p in ps):
            return files, emb
    cfg = load_config()
    model = build_registry(threads=cfg["runtime"]["threads"]).get(model_id)
    emb = {}
    for ps in files.values():
        for p in ps:
            x, sr = load_audio(p)
            emb[p] = analyze(model, x, sr, energy_dbfs=cfg["gates"]["energy_dbfs"]).clip_embedding()
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.savez(cache, paths=np.array([str(p) for p in emb]), emb=np.stack(list(emb.values())))
    return files, emb


def sweep(model_id: str, folder: Path, shots: int, splits: int, margin: float, seed: int = 0) -> list[dict]:
    files, emb = embeddings(model_id, folder)
    classes = list(files)
    dim = len(next(iter(emb.values())))
    rng = np.random.default_rng(seed)
    grid = np.round(np.arange(0.40, 0.96, 0.025), 3)
    acc = {t: np.zeros(4) for t in grid}
    counts = np.zeros(2)
    for _ in range(splits):
        novel = classes[int(rng.integers(len(classes)))]
        head = PrototypeHead(model_id, "", dim)
        test_known = []
        for c in classes:
            tr, te = _split(files[c], shots, rng, by_recording=True)
            if c == novel:
                continue
            for p in tr:
                head.add_example(c, emb[p])
            test_known += [(c, emb[p]) for p in te]
        test_novel = [emb[p] for p in files[novel]]
        counts += [len(test_known), len(test_novel)]
        sims_k = [(c, head.similarities(e)) for c, e in test_known]
        sims_n = [head.similarities(e) for e in test_novel]
        for t in grid:
            dk = [(c, decide(s, t, margin)) for c, s in sims_k]
            dn = [decide(s, t, margin) for s in sims_n]
            acc[t] += [
                sum(d.label == c for c, d in dk), sum(d.label is None for _, d in dk),
                sum(d.label is None for d in dn), sum(d.label is not None for d in dn),
            ]
    rows = []
    for t in grid:
        k_ok, k_unk, n_unk, n_wrong = acc[t]
        rows.append({
            "t_known": float(t),
            "known_ok": round(k_ok / counts[0], 3), "known_unknown": round(k_unk / counts[0], 3),
            "novel_unknown": round(n_unk / counts[1], 3), "novel_wrong": round(n_wrong / counts[1], 3),
        })
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", required=True)
    ap.add_argument("--folder", default=str(ROOT / "data" / "esc50"))
    ap.add_argument("--shots", type=int, default=5)
    ap.add_argument("--splits", type=int, default=20)
    ap.add_argument("--margin", type=float, default=load_config()["head"]["margin"])
    a = ap.parse_args()
    rows = sweep(a.model, Path(a.folder), a.shots, a.splits, a.margin)
    best = max(rows, key=lambda r: r["known_ok"] + r["novel_unknown"])
    print(f"{'T_known':>8} {'known_ok':>9} {'known_unk':>10} {'novel_unk':>10} {'novel_wrong':>12}")
    for r in rows:
        mark = "  <- suggested" if r is best else ""
        print(f"{r['t_known']:8.3f} {r['known_ok']:9.3f} {r['known_unknown']:10.3f} {r['novel_unknown']:10.3f} {r['novel_wrong']:12.3f}{mark}")
    print(json.dumps({"model_id": a.model, "shots": a.shots, "margin": a.margin, "suggested_t_known": best["t_known"]}))


if __name__ == "__main__":
    main()
