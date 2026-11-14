"""Audio inputs for the listening post: microphone, one file, or a looping playlist.

Every source delivers mono float32 at `sample_rate` in blocking `read(seconds)`
calls and returns None when it is finished. File sources pace themselves in
real time (optionally faster) so the device behaves as it would with a mic.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
import time
from pathlib import Path

import numpy as np

from core.audio import SUPPORTED_EXTENSIONS, load_audio

log = logging.getLogger("biospectra.device.sources")


class MicSource:
    """Live microphone. Uses `arecord` (ALSA) on Linux and the UNO Q, `sounddevice` elsewhere."""

    def __init__(self, sample_rate: int, device: str | None = None) -> None:
        self.sample_rate = sample_rate
        self.label = "mic"
        self._proc: subprocess.Popen | None = None
        self._stream = None
        if shutil.which("arecord"):
            cmd = ["arecord", "-q", "-f", "S16_LE", "-c", "1", "-r", str(sample_rate), "-t", "raw"]
            if device:
                cmd[1:1] = ["-D", device]
            log.info("microphone via arecord: %s", " ".join(cmd))
            self._proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            import sounddevice as sd  # PortAudio (macOS / Windows laptops)

            self._stream = sd.InputStream(samplerate=sample_rate, channels=1, dtype="float32",
                                          device=device or None)
            self._stream.start()
            log.info("microphone via sounddevice: %s", self._stream.device)

    def read(self, seconds: float) -> np.ndarray | None:
        n = int(round(seconds * self.sample_rate))
        if self._proc is not None:
            raw = self._proc.stdout.read(n * 2)
            if not raw:
                err = self._proc.stderr.read().decode(errors="ignore") if self._proc.stderr else ""
                raise RuntimeError(f"arecord stopped: {err.strip() or 'no data'}")
            return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
        data, _ = self._stream.read(n)
        return data[:, 0].copy()

    def close(self) -> None:
        if self._proc is not None:
            self._proc.terminate()
        if self._stream is not None:
            self._stream.close()


class _Paced:
    """Feeds pre-loaded audio in real time (speed > 1 runs faster, speed 0 as fast as possible)."""

    def __init__(self, sample_rate: int, speed: float) -> None:
        self.sample_rate = sample_rate
        self.speed = speed
        self._t_next = time.monotonic()

    def _pace(self, seconds: float) -> None:
        if self.speed <= 0:
            return
        self._t_next += seconds / self.speed
        delay = self._t_next - time.monotonic()
        if delay > 0:
            time.sleep(delay)
        else:
            self._t_next = time.monotonic()


class FileSource(_Paced):
    def __init__(self, path: str | Path, sample_rate: int, speed: float = 1.0, loop: bool = False) -> None:
        super().__init__(sample_rate, speed)
        self.path = Path(path)
        self.label = self.path.name
        self.loop = loop
        self._x, _ = load_audio(self.path, sample_rate)
        self._pos = 0

    def read(self, seconds: float) -> np.ndarray | None:
        n = int(round(seconds * self.sample_rate))
        if self._pos >= len(self._x):
            if not self.loop:
                return None
            self._pos = 0
        out = self._x[self._pos: self._pos + n]
        self._pos += n
        if len(out) < n:
            out = np.pad(out, (0, n - len(out)))
        self._pace(seconds)
        return out

    def close(self) -> None:
        pass


class PlaylistSource(_Paced):
    """Plays every audio file in a folder in name order. `label` tells which file the last read came from."""

    def __init__(self, folder: str | Path, sample_rate: int, speed: float = 1.0, loop: bool = True,
                 gap_seconds: float = 0.0) -> None:
        super().__init__(sample_rate, speed)
        self.files = sorted(p for p in Path(folder).iterdir() if p.suffix.lower() in SUPPORTED_EXTENSIONS)
        if not self.files:
            raise FileNotFoundError(f"no audio files in {folder}")
        self.loop = loop
        self.gap = np.zeros(int(gap_seconds * sample_rate), dtype=np.float32)
        self._cache: dict[Path, np.ndarray] = {}
        self._i = 0
        self._pos = 0
        self.label = self.files[0].name
        self.rounds = 0

    def _audio(self, p: Path) -> np.ndarray:
        if p not in self._cache:
            x, _ = load_audio(p, self.sample_rate)
            self._cache[p] = np.concatenate([x, self.gap])
        return self._cache[p]

    def read(self, seconds: float) -> np.ndarray | None:
        n = int(round(seconds * self.sample_rate))
        parts, labels, need = [], [], n
        while need > 0:
            if self._i >= len(self.files):
                if not self.loop:
                    break
                self._i = 0
                self.rounds += 1
            p = self.files[self._i]
            x = self._audio(p)
            take = x[self._pos: self._pos + need]
            parts.append(take)
            labels.append((len(take), p.name))
            need -= len(take)
            self._pos += len(take)
            if self._pos >= len(x):
                self._i += 1
                self._pos = 0
        if not parts:
            return None
        self.label = max(labels)[1]  # the file that filled most of this read
        out = np.concatenate(parts)
        if len(out) < n:
            out = np.pad(out, (0, n - len(out)))
        self._pace(seconds)
        return out

    def close(self) -> None:
        pass
