"""Build a demo playlist of 5 s clips with the light each clip should produce.

    python -m tools.make_playlist --model yamnet-tflite --out data/playlist

Uses clips from recordings that were NOT used for the prototypes (see
tools.make_prototypes). Writes NN_<class>.wav files plus expected.json:

* known animal (frog, birds)  -> recognized
* noise (rain, wind)          -> quiet
* unknown animal (crickets)   -> needs_help, queued
* human speech                -> quiet, never queued
* silence                     -> quiet
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from bench.batch import recording_id, scan_folder
from core.audio import load_audio, save_wav
from core.config import ROOT, data_path

SR = 48000
SCENARIO = [  # (class or special, expected state, expected label)
    ("frog", "recognized", "frog"),
    ("rain", "quiet", None),
    ("crickets", "needs_help", None),
    ("@speech", "quiet", None),
    ("chirping_birds", "recognized", "chirping_birds"),
    ("@silence", "quiet", None),
    ("insects", "needs_help", None),
    ("wind", "quiet", None),
]


def five_seconds(x: np.ndarray) -> np.ndarray:
    n = 5 * SR
    return np.pad(x[:n], (0, max(0, n - len(x))))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--model", default="yamnet-tflite")
    ap.add_argument("--folder", default=str(ROOT / "data" / "esc50"))
    ap.add_argument("--speech", default=str(ROOT / "data" / "testset_speech"))
    ap.add_argument("--out", default=str(ROOT / "data" / "playlist"))
    a = ap.parse_args()
    files = scan_folder(a.folder)
    used_file = data_path("prototypes") / f"{a.model}.used.json"
    used = json.loads(used_file.read_text()) if used_file.exists() else {}
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.wav"):
        old.unlink()
    expected = {}
    for i, (cls, state, label) in enumerate(SCENARIO, 1):
        name = f"{i:02d}_{cls.lstrip('@')}.wav"
        if cls == "@silence":
            x = np.zeros(5 * SR, np.float32)
            src = "digital silence"
        elif cls == "@speech":
            sp = sorted(p for p in Path(a.speech).iterdir() if p.suffix in (".aiff", ".wav"))
            if not sp:
                raise SystemExit(f"no speech clips in {a.speech} (macOS: say -o {a.speech}/s1.aiff 'hello')")
            x, _ = load_audio(sp[0], SR)
            src = sp[0].name
        else:
            fresh = [p for p in files[cls] if recording_id(p).split(":")[-1] not in
                     {r.split(":")[-1] for r in used.get(cls, [])}]
            pick = (fresh or files[cls])[-1]
            x, _ = load_audio(pick, SR)
            src = pick.name
        save_wav(out / name, five_seconds(x), SR)
        expected[name] = {"state": state, "label": label, "source": src}
        print(f"{name:22s} expect {state:11s} {label or '':15s} from {src}")
    (out / "expected.json").write_text(json.dumps(expected, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
