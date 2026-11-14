"""Audio I/O and signal helpers shared by bench, device and backend.

All audio inside the pipeline is mono float32 in [-1, 1].
Decoding goes through ffmpeg so mp3, mp4, m4a, wav, ogg and flac all work,
including audio tracks inside video files.
"""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SUPPORTED_EXTENSIONS = {".mp3", ".mp4", ".m4a", ".wav", ".ogg", ".oga", ".flac", ".webm", ".mov"}

# STFT used for display and masking (the game uses the same parameters)
STFT_N_FFT = 1024
STFT_HOP = 256


class FfmpegMissing(RuntimeError):
    pass


def check_ffmpeg() -> str:
    """Return the ffmpeg path or raise with an install hint."""
    path = shutil.which("ffmpeg")
    if not path:
        raise FfmpegMissing(
            "ffmpeg is not installed. Install it first: "
            "macOS `brew install ffmpeg`, Debian/UNO Q `sudo apt install ffmpeg`."
        )
    return path


def probe_sample_rate(path: str | Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=False,
    )
    try:
        return int(out.stdout.strip().splitlines()[0])
    except (ValueError, IndexError) as e:
        raise ValueError(f"No audio stream found in {path}") from e


SOUNDFILE_EXTENSIONS = {".wav", ".flac", ".ogg", ".oga", ".aiff", ".aif"}


def _load_soundfile(path: str | Path, sr: int | None) -> tuple[np.ndarray, int]:
    x, native = sf.read(str(path), dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    if sr and sr != native:
        x = resample(x, native, sr)
    return np.clip(x, -1.0, 1.0), sr or native


def load_audio(path: str | Path, sr: int | None = None) -> tuple[np.ndarray, int]:
    """Decode any supported file to mono float32. Resamples if `sr` is given.

    Uses ffmpeg (all formats, also video). Without ffmpeg, as on a fresh UNO Q,
    WAV/FLAC/OGG/AIFF still load through soundfile.
    """
    if not shutil.which("ffmpeg") and Path(path).suffix.lower() in SOUNDFILE_EXTENSIONS:
        return _load_soundfile(path, sr)
    ffmpeg = check_ffmpeg()
    target = sr or probe_sample_rate(path)
    cmd = [ffmpeg, "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", str(target),
           "-f", "f32le", "-acodec", "pcm_f32le", "-"]
    proc = subprocess.run(cmd, capture_output=True, check=False)
    if proc.returncode != 0:
        raise ValueError(f"ffmpeg could not decode {path}: {proc.stderr.decode(errors='ignore')[:300]}")
    x = np.frombuffer(proc.stdout, dtype=np.float32).copy()
    if x.size == 0:
        raise ValueError(f"{path} contains no audio samples")
    return np.clip(x, -1.0, 1.0), target


def save_wav(path: str | Path, x: np.ndarray, sr: int) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, np.clip(x, -1, 1).astype(np.float32), sr, subtype="PCM_16")
    return path


def resample(x: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    """Polyphase resampling (anti-aliased). No-op when rates match."""
    if sr_in == sr_out:
        return x.astype(np.float32, copy=False)
    g = gcd(sr_in, sr_out)
    return signal.resample_poly(x, sr_out // g, sr_in // g).astype(np.float32)


@dataclass
class Windows:
    data: np.ndarray  # (n, samples)
    starts: np.ndarray  # start time of each window in seconds
    sr: int
    window_seconds: float


def make_windows(x: np.ndarray, sr: int, window_seconds: float, hop_seconds: float | None = None) -> Windows:
    """Split into fixed windows. The last window is zero-padded. Always returns at least one window."""
    win = int(round(window_seconds * sr))
    hop = int(round((hop_seconds or window_seconds) * sr))
    n = max(1, int(np.ceil(max(0, len(x) - win) / hop)) + 1)
    out = np.zeros((n, win), dtype=np.float32)
    for i in range(n):
        seg = x[i * hop: i * hop + win]
        out[i, : len(seg)] = seg
    return Windows(out, np.arange(n) * hop / sr, sr, window_seconds)


def rms_dbfs(x: np.ndarray) -> float:
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x, dtype=np.float64))) + 1e-12))


# ---------------------------------------------------------------- spectrograms

@dataclass
class Spectrogram:
    db: np.ndarray  # (freq, time)
    times: np.ndarray  # seconds
    freqs: np.ndarray  # Hz (linear STFT) or mel band centre frequencies
    kind: str  # "stft" | "mel"


def _stft(x: np.ndarray, sr: int, n_fft: int = STFT_N_FFT, hop: int = STFT_HOP):
    return signal.stft(x, fs=sr, window="hann", nperseg=n_fft, noverlap=n_fft - hop, boundary="even", padded=True)


def stft_spectrogram(x: np.ndarray, sr: int, n_fft: int = STFT_N_FFT, hop: int = STFT_HOP) -> Spectrogram:
    f, t, z = _stft(x, sr, n_fft, hop)
    db = 20 * np.log10(np.abs(z) + 1e-9)
    return Spectrogram(db.astype(np.float32), t, f, "stft")


def _hz_to_mel(hz: np.ndarray | float) -> np.ndarray:
    return 2595.0 * np.log10(1.0 + np.asarray(hz) / 700.0)


def _mel_to_hz(mel: np.ndarray) -> np.ndarray:
    return 700.0 * (10 ** (mel / 2595.0) - 1.0)


def mel_filterbank(sr: int, n_fft: int, n_mels: int, fmin: float = 50.0, fmax: float | None = None) -> tuple[np.ndarray, np.ndarray]:
    fmax = fmax or sr / 2
    mels = np.linspace(_hz_to_mel(fmin), _hz_to_mel(fmax), n_mels + 2)
    hz = _mel_to_hz(mels)
    bins = np.fft.rfftfreq(n_fft, 1 / sr)
    fb = np.zeros((n_mels, len(bins)), dtype=np.float32)
    for m in range(n_mels):
        lo, c, hi = hz[m], hz[m + 1], hz[m + 2]
        up = (bins - lo) / max(c - lo, 1e-9)
        down = (hi - bins) / max(hi - c, 1e-9)
        fb[m] = np.clip(np.minimum(up, down), 0, None)
    return fb, hz[1:-1]


def mel_spectrogram(x: np.ndarray, sr: int, n_mels: int = 64, n_fft: int = STFT_N_FFT, hop: int = STFT_HOP) -> Spectrogram:
    f, t, z = _stft(x, sr, n_fft, hop)
    fb, centres = mel_filterbank(sr, n_fft, n_mels)
    power = fb @ (np.abs(z) ** 2)
    return Spectrogram((10 * np.log10(power + 1e-12)).astype(np.float32), t, centres, "mel")


def apply_mask(x: np.ndarray, sr: int, mask: np.ndarray, n_fft: int = STFT_N_FFT, hop: int = STFT_HOP) -> np.ndarray:
    """Multiply the STFT by a (freq, time) mask in [0, 1] and invert back to audio.

    The mask must have the shape of `stft_spectrogram(x, sr).db`. The game sends
    masks on that grid, so the carved-out region can be played back.
    """
    _, _, z = _stft(x, sr, n_fft, hop)
    if mask.shape != z.shape:
        raise ValueError(f"mask shape {mask.shape} does not match STFT shape {z.shape}")
    _, y = signal.istft(z * np.clip(mask, 0, 1), fs=sr, window="hann", nperseg=n_fft, noverlap=n_fft - hop, boundary=True)
    y = y[: len(x)]
    if len(y) < len(x):
        y = np.pad(y, (0, len(x) - len(y)))
    return y.astype(np.float32)
