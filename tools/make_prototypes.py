"""Build a prototype file for the device from labelled clips (one subfolder per class).

    python -m tools.make_prototypes --model yamnet-tflite --known frog,chirping_birds,crow \
        --noise rain,wind,engine --shots 5

Animal classes keep their name. Noise classes are stored as `noise:<class>`
(one prototype each), and the device stays quiet on any `noise:*` match. The recordings used here are listed in
`<model>.used.json` so demo playlists can pick clips from other recordings.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from bench.batch import recording_id, scan_folder
from core.audio import load_audio
from core.config import ROOT, data_path, load_config
from core.heads import PrototypeHead
from core.models import build_registry
from core.pipeline import analyze


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", default=load_config()["device"]["model_id"])
    ap.add_argument("--folder", default=str(ROOT / "data" / "esc50"))
    ap.add_argument("--known", default="frog,chirping_birds,crow")
    ap.add_argument("--noise", default="rain,wind,engine")
    ap.add_argument("--shots", type=int, default=5)
    a = ap.parse_args()
    cfg = load_config()
    files = scan_folder(a.folder)
    model = build_registry(threads=cfg["runtime"]["threads"]).get(a.model)
    head = PrototypeHead(model.model_id, model.model_version, model.embedding_dim)
    used: dict[str, list[str]] = {}
    noise = cfg["head"]["noise_label"]
    # one prototype per noise type: the mean of rain, wind and engine together resembles none of them
    plan = [(c, c) for c in a.known.split(",") if c] + [(c, f"{noise}:{c}") for c in a.noise.split(",") if c]
    for cls, label in plan:
        if cls not in files:
            raise SystemExit(f"class '{cls}' not in {a.folder}")
        picked, recs = [], set()
        for p in files[cls]:  # one clip per recording, so the prototype covers different recordings
            r = recording_id(p)
            if r in recs:
                continue
            recs.add(r)
            picked.append(p)
            if len(picked) == a.shots:
                break
        for p in picked:
            x, sr = load_audio(p)
            head.add_example(label, analyze(model, x, sr, energy_dbfs=cfg["gates"]["energy_dbfs"]).clip_embedding())
        used[cls] = sorted(recs)
        print(f"{cls:16s} -> {label:14s} {len(picked)} clips")
    out = head.save(data_path("prototypes") / f"{model.model_id}.prototype.json")
    (out.parent / f"{model.model_id}.used.json").write_text(json.dumps(used, indent=1), encoding="utf-8")
    print(f"wrote {out} (version {head.version}, classes {head.classes})")


if __name__ == "__main__":
    main()
