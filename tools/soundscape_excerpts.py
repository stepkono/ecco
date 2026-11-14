"""Cut the busiest minutes out of the one-hour soundscapes, sized for the console upload.

    python -m tools.soundscape_excerpts --minutes 3

For every one-hour recording in data/soundscapes/{amazon,northeast}, the window
with the most annotated calls is written as 48 kHz mono WAV to
data/soundscapes/excerpts/, plus excerpts.csv listing what is audible in each.
AnuraSet files are one minute long already and can be uploaded as they are.
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import soundfile as sf

from core.audio import resample, save_wav
from core.config import ROOT

SR = 48000


def best_window(calls: list[tuple[float, float, str]], length_s: float, total_s: float) -> float:
    starts = np.arange(0, max(1.0, total_s - length_s), 10.0)
    counts = [sum(1 for s, e, _ in calls if s < t + length_s and e > t) for t in starts]
    return float(starts[int(np.argmax(counts))])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(ROOT / "data" / "soundscapes"))
    ap.add_argument("--minutes", type=float, default=3.0)
    a = ap.parse_args()
    root = Path(a.root)
    out_dir = root / "excerpts"
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    for ds in ("amazon", "northeast"):
        ann = root / ds / "annotations.csv"
        if not ann.exists():
            continue
        calls = defaultdict(list)
        for r in csv.DictReader(open(ann, encoding="utf-8")):
            calls[r["Filename"]].append((float(r["Start Time (s)"]), float(r["End Time (s)"]), r["Species eBird Code"]))
        for flac in sorted((root / ds).glob("*.flac")):
            info = sf.info(flac)
            length = a.minutes * 60
            t0 = best_window(calls[flac.name], length, info.duration)
            x, sr = sf.read(flac, start=int(t0 * info.samplerate), frames=int(length * info.samplerate),
                            dtype="float32", always_2d=True)
            x = resample(x.mean(axis=1), sr, SR)
            peak = float(np.max(np.abs(x))) or 1.0
            x = x * min(1.0, 0.9 / peak) if peak > 0.9 else x
            inside = [c for s, e, c in calls[flac.name] if s < t0 + length and e > t0]
            dst = out_dir / f"{ds}_{flac.stem}_{int(t0 // 60):02d}m{int(t0 % 60):02d}s.wav"
            save_wav(dst, x, SR)
            top = ", ".join(f"{k}×{v}" for k, v in Counter(inside).most_common(5))
            rows.append({"file": dst.name, "dataset": ds, "source": flac.name, "start_s": t0, "length_s": length,
                         "annotated_calls": len(inside), "species": len(set(inside)), "top_species": top})
            print(f"{dst.name:60s} {len(inside):4d} calls, {len(set(inside)):2d} species  {dst.stat().st_size / 1e6:.0f} MB")
    with open(out_dir / "excerpts.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else ["file"])
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
