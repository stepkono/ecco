"""Cut long labelled recordings into short clips for the bench's batch evaluation.

    python -m tools.make_test_set --src data/raw --out data/testset --length 5 --hop 2.5

`--src` holds one subfolder per class (folder name = label) with recordings of any
length and format. Chunks quieter than the energy gate are skipped. Without
data/raw, the clips in public/audio are used (one class per file).
"""

from __future__ import annotations

import argparse
from pathlib import Path

from core.audio import SUPPORTED_EXTENSIONS, load_audio, rms_dbfs, save_wav
from core.config import ROOT, load_config

FALLBACK = {  # public/audio file -> class
    "frog_hyla_cinerea.wav": "green_treefrog", "frog_pelophylax.wav": "marsh_frog",
    "frog_litoria_fallax.wav": "sedge_frog", "cicada_orni.wav": "cicada",
    "chainsaw_a.wav": "chainsaw", "chainsaw_b.wav": "chainsaw",
    "rain_drops.wav": "rain", "rain_light.wav": "rain",
}


def sources(src: Path) -> dict[str, list[Path]]:
    if src.is_dir():
        return {d.name: sorted(f for f in d.iterdir() if f.suffix.lower() in SUPPORTED_EXTENSIONS)
                for d in sorted(src.iterdir()) if d.is_dir()}
    out: dict[str, list[Path]] = {}
    for f, c in FALLBACK.items():
        out.setdefault(c, []).append(ROOT / "public" / "audio" / f)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=str(ROOT / "data" / "raw"))
    ap.add_argument("--out", default=str(ROOT / "data" / "testset"))
    ap.add_argument("--length", type=float, default=5.0)
    ap.add_argument("--hop", type=float, default=2.5)
    ap.add_argument("--max-per-file", type=int, default=12)
    a = ap.parse_args()
    gate = load_config()["gates"]["energy_dbfs"]
    out = Path(a.out)
    for label, files in sources(Path(a.src)).items():
        n = 0
        for f in files:
            x, sr = load_audio(f)
            win, hop = int(a.length * sr), int(a.hop * sr)
            k = 0
            for start in range(0, max(1, len(x) - win + 1), hop):
                seg = x[start: start + win]
                if rms_dbfs(seg) < gate or k >= a.max_per_file:
                    continue
                save_wav(out / label / f"{f.stem}_{start / sr:05.1f}s.wav", seg, sr)
                k += 1
            n += k
        print(f"{label}: {n} clips")


if __name__ == "__main__":
    main()
