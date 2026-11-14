"""Import a subset of ESC-50 into the bench's class-per-folder layout.

    python -m tools.import_esc50 --src data/downloads/ESC-50-master --out data/esc50

ESC-50 (Piczak 2015, github.com/karolpiczak/ESC-50): 2,000 clips of 5 s,
50 classes, 40 clips each, CC BY-NC 3.0 (non-commercial). File names are
`{fold}-{freesound id}-{take}-{class}.wav`. Clips with the same freesound id
come from the same recording, which the batch evaluation uses to keep training
and test clips apart.
"""

from __future__ import annotations

import argparse
import csv
import shutil
from pathlib import Path

from core.config import ROOT

# classes that matter for a forest / wetland listening post
NATURE = [
    "frog", "crickets", "insects", "chirping_birds", "crow", "rooster",
    "rain", "wind", "thunderstorm", "water_drops", "sea_waves", "crackling_fire",
    "chainsaw", "hand_saw", "engine", "airplane", "footsteps", "dog",
]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=str(ROOT / "data" / "downloads" / "ESC-50-master"))
    ap.add_argument("--out", default=str(ROOT / "data" / "esc50"))
    ap.add_argument("--classes", default=",".join(NATURE), help="comma-separated ESC-50 categories, or 'all'")
    a = ap.parse_args()
    src = Path(a.src)
    meta = src / "meta" / "esc50.csv"
    if not meta.is_file():
        raise SystemExit(f"{meta} not found. Download and unzip ESC-50 first (see README).")
    wanted = None if a.classes == "all" else set(a.classes.split(","))
    counts: dict[str, int] = {}
    with open(meta, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cat = row["category"]
            if wanted is not None and cat not in wanted:
                continue
            dst = Path(a.out) / cat / row["filename"]
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists():
                shutil.copy2(src / "audio" / row["filename"], dst)
            counts[cat] = counts.get(cat, 0) + 1
    for cat, n in sorted(counts.items()):
        print(f"{cat:16s} {n}")
    missing = sorted((wanted or set()) - set(counts))
    if missing:
        print("not in ESC-50:", ", ".join(missing))


if __name__ == "__main__":
    main()
