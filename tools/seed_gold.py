"""Add hidden gold clips (sounds with a known answer) to the backend.

    python -m tools.seed_gold --folder data/esc50 --map frog=frog,chirping_birds=chirping_birds,crow=crow,rain=noise --per-class 3

Gold clips look like normal puzzles. Answers to them update the player's
reliability and are never used for learning. `--map` maps a class folder to a
backend label. Clips from recordings used for the device prototypes are skipped.
"""

from __future__ import annotations

import argparse
import json
import tempfile
from pathlib import Path

from bench.batch import recording_id, scan_folder
from core.audio import load_audio, save_wav
from core.config import ROOT, data_path, load_config


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--folder", default=str(ROOT / "data" / "esc50"))
    ap.add_argument("--map", default="frog=frog,chirping_birds=chirping_birds,crow=crow,rain=noise,wind=noise")
    ap.add_argument("--per-class", type=int, default=2)
    a = ap.parse_args()
    cfg = load_config()
    from backend.service import Backend
    from backend.store import Store

    be = Backend(cfg, Store(ROOT / cfg["paths"]["backend"]))
    used_file = data_path("prototypes") / f"{be.model_id}.used.json"
    used = json.loads(used_file.read_text()) if used_file.exists() else {}
    files = scan_folder(a.folder)
    for pair in a.map.split(","):
        cls, label = pair.split("=")
        avoid = {r.split(":")[-1] for r in used.get(cls, [])}
        picks = [p for p in files.get(cls, []) if recording_id(p).split(":")[-1] not in avoid][: a.per_class]
        for p in picks:
            x, sr = load_audio(p, 48000)
            with tempfile.TemporaryDirectory() as d:
                wav = save_wav(Path(d) / "g.wav", x, sr)
                cid = be.add_gold(str(wav), label)
            print(f"gold {cid}: {p.name} -> {label}")


if __name__ == "__main__":
    main()
