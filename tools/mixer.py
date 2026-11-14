"""Mix a clean call into noise at a chosen SNR and write the ground truth.

    python -m tools.mixer --call call.wav --noise rain.wav --snr 0 --offset 1.0 --label green_treefrog

Output: <name>.wav plus <name>.json with everything needed to score a model
or a player later (where the call is, at which SNR, from which files).
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

from core.audio import load_audio, resample, rms_dbfs, save_wav

MAX_SR = 48000  # highest model rate (BirdNET). Mixing above it only wastes space.


@dataclass
class MixTruth:
    format: str
    label: str
    call_file: str
    noise_file: str
    sample_rate: int
    length_s: float
    snr_db: float
    offset_s: float  # where the call starts inside the mix
    call_start_s: float  # where the call segment was taken from in the call file
    call_duration_s: float
    call_rms_dbfs: float
    noise_rms_dbfs: float
    noise_gain: float
    peak_normalised: bool
    created_at: str


def _active_rms(x: np.ndarray, sr: int) -> float:
    """RMS over the louder half of 50 ms frames, so silence inside a call does not lower its level."""
    hop = max(1, int(0.05 * sr))
    frames = [x[i: i + hop] for i in range(0, len(x) - hop + 1, hop)] or [x]
    levels = np.array([np.sqrt(np.mean(f.astype(np.float64) ** 2)) for f in frames])
    top = np.sort(levels)[len(levels) // 2:]
    return float(np.sqrt(np.mean(top ** 2)) + 1e-12)


def mix(call: np.ndarray, call_sr: int, noise: np.ndarray, noise_sr: int, *, snr_db: float, offset_s: float,
        length_s: float = 5.0, call_start_s: float = 0.0, seed: int = 0) -> tuple[np.ndarray, int, dict]:
    sr = min(MAX_SR, max(call_sr, noise_sr))
    c = resample(call, call_sr, sr)
    n = resample(noise, noise_sr, sr)
    total = int(round(length_s * sr))
    # noise: loop if short, random start if long
    rng = np.random.default_rng(seed)
    if len(n) < total:
        n = np.tile(n, int(np.ceil(total / len(n))))
    start = int(rng.integers(0, len(n) - total + 1))
    bed = n[start: start + total].astype(np.float32)
    # call: take from call_start_s, place at offset_s, cut at the end of the mix
    off = int(round(offset_s * sr))
    seg = c[int(round(call_start_s * sr)):][: max(0, total - off)]
    placed = np.zeros(total, dtype=np.float32)
    placed[off: off + len(seg)] = seg
    # scale the noise so that call_rms / noise_rms = snr
    gain = _active_rms(seg, sr) / (_active_rms(bed, sr) * 10 ** (snr_db / 20))
    out = placed + bed * gain
    peak = float(np.max(np.abs(out)))
    norm = peak > 0.99
    if norm:
        out = out * (0.99 / peak)
    info = {
        "sample_rate": sr, "noise_gain": float(gain), "peak_normalised": norm,
        "call_duration_s": len(seg) / sr, "call_rms_dbfs": rms_dbfs(seg), "noise_rms_dbfs": rms_dbfs(bed * gain),
    }
    return out.astype(np.float32), sr, info


def mix_files(call_path: str | Path, noise_path: str | Path, out_dir: str | Path, *, label: str, snr_db: float,
              offset_s: float, length_s: float = 5.0, call_start_s: float = 0.0, seed: int = 0,
              name: str | None = None) -> tuple[Path, Path]:
    call, csr = load_audio(call_path)
    noise, nsr = load_audio(noise_path)
    y, sr, info = mix(call, csr, noise, nsr, snr_db=snr_db, offset_s=offset_s, length_s=length_s,
                      call_start_s=call_start_s, seed=seed)
    name = name or f"{label}_{Path(noise_path).stem}_snr{snr_db:+.0f}dB_{int(time.time())}"
    out_dir = Path(out_dir)
    wav = save_wav(out_dir / f"{name}.wav", y, sr)
    truth = MixTruth(
        format="biospectra-mix/1", label=label, call_file=Path(call_path).name, noise_file=Path(noise_path).name,
        sample_rate=sr, length_s=length_s, snr_db=snr_db, offset_s=offset_s, call_start_s=call_start_s,
        call_duration_s=round(info["call_duration_s"], 3), call_rms_dbfs=round(info["call_rms_dbfs"], 2),
        noise_rms_dbfs=round(info["noise_rms_dbfs"], 2), noise_gain=round(info["noise_gain"], 5),
        peak_normalised=info["peak_normalised"], created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )
    js = out_dir / f"{name}.json"
    js.write_text(json.dumps(asdict(truth), indent=2), encoding="utf-8")
    return wav, js


def append_manifest(demo_dir: str | Path, wav: Path, truth_json: Path) -> Path:
    """Keep a manifest.jsonl in the demo set so tools and the backend can find the ground truth."""
    demo_dir = Path(demo_dir)
    demo_dir.mkdir(parents=True, exist_ok=True)
    row = json.loads(Path(truth_json).read_text(encoding="utf-8"))
    row["file"] = wav.name
    m = demo_dir / "manifest.jsonl"
    with open(m, "a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    return m


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--call", required=True)
    ap.add_argument("--noise", required=True)
    ap.add_argument("--label", required=True)
    ap.add_argument("--snr", type=float, default=0.0)
    ap.add_argument("--offset", type=float, default=1.0)
    ap.add_argument("--length", type=float, default=5.0)
    ap.add_argument("--call-start", type=float, default=0.0)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out", default="data/mixes")
    a = ap.parse_args()
    wav, js = mix_files(a.call, a.noise, a.out, label=a.label, snr_db=a.snr, offset_s=a.offset,
                        length_s=a.length, call_start_s=a.call_start, seed=a.seed)
    print(wav, js)


if __name__ == "__main__":
    main()
