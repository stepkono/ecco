"""Common model interface and a lazy registry.

Every audio model is wrapped in an adapter that satisfies `AudioModel`.
UI, heads and gates only talk to this interface, so adding a model means
adding one adapter file and one registry line, nothing else.
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Callable, Protocol, runtime_checkable

import numpy as np
import psutil

log = logging.getLogger("biospectra.models")


@runtime_checkable
class AudioModel(Protocol):
    model_id: str
    model_version: str
    sample_rate: int
    window_seconds: float
    embedding_dim: int

    def load(self) -> None: ...
    def embed(self, windows: np.ndarray) -> np.ndarray: ...  # (n, d)
    def classify(self, windows: np.ndarray, top_k: int = 5) -> list[list[tuple[str, float]]]: ...


class ModelUnavailable(RuntimeError):
    """Raised when a model cannot be loaded on this machine. The message is shown in the UI."""


@dataclass
class LoadStats:
    load_seconds: float = 0.0
    rss_before_mb: float = 0.0
    rss_after_mb: float = 0.0

    @property
    def rss_delta_mb(self) -> float:
        return self.rss_after_mb - self.rss_before_mb


def rss_mb() -> float:
    return psutil.Process().memory_info().rss / 1e6


class BaseAudioModel(ABC):
    """Shared plumbing: lazy load, timing, scores to top-k, embedding normalisation."""

    model_id: str = ""
    model_version: str = ""
    sample_rate: int = 0
    window_seconds: float = 0.0
    embedding_dim: int = 0
    source: str = ""
    license: str = ""
    input_format: str = ""

    def __init__(self, threads: int | None = None) -> None:
        self.threads = threads
        self.labels: list[str] = []
        self.loaded = False
        self.load_stats = LoadStats()
        self.last_latency_s: list[float] = []

    # -- lifecycle --------------------------------------------------------
    def load(self) -> None:
        if self.loaded:
            return
        before = rss_mb()
        t0 = time.perf_counter()
        self._load()
        # warm-up: the first invoke allocates buffers, keep that out of per-window latency
        self._both_batch(np.zeros((1, self.window_samples), dtype=np.float32))
        self.load_stats = LoadStats(time.perf_counter() - t0, before, rss_mb())
        self.loaded = True
        log.info(
            "loaded %s v%s: sr=%d Hz, window=%.3f s, embedding_dim=%d, classes=%d, load=%.2f s, rss +%.0f MB",
            self.model_id, self.model_version, self.sample_rate, self.window_seconds,
            self.embedding_dim, len(self.labels), self.load_stats.load_seconds, self.load_stats.rss_delta_mb,
        )

    @abstractmethod
    def _load(self) -> None: ...

    # -- inference (subclasses implement per-batch calls) ----------------
    @abstractmethod
    def _embed_batch(self, windows: np.ndarray) -> np.ndarray: ...

    @abstractmethod
    def _scores_batch(self, windows: np.ndarray) -> np.ndarray: ...

    def _both_batch(self, windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Embedding and scores for one window. Override when one inference yields both."""
        return self._embed_batch(windows), self._scores_batch(windows)

    @property
    def window_samples(self) -> int:
        return int(round(self.window_seconds * self.sample_rate))

    def _check(self, windows: np.ndarray) -> np.ndarray:
        self.load()
        w = np.asarray(windows, dtype=np.float32)
        if w.ndim == 1:
            w = w[None, :]
        if w.shape[1] != self.window_samples:
            raise ValueError(f"{self.model_id} expects windows of {self.window_samples} samples, got {w.shape[1]}")
        return np.ascontiguousarray(w)

    def _timed(self, fn: Callable[[np.ndarray], np.ndarray], windows: np.ndarray) -> np.ndarray:
        w = self._check(windows)
        outs, lat = [], []
        for i in range(len(w)):  # one window at a time: matches the device and gives per-window latency
            t0 = time.perf_counter()
            outs.append(np.asarray(fn(w[i: i + 1]), dtype=np.float32).reshape(1, -1))
            lat.append(time.perf_counter() - t0)
        self.last_latency_s = lat
        return np.concatenate(outs, axis=0)

    def embed(self, windows: np.ndarray) -> np.ndarray:
        return self._timed(self._embed_batch, windows)

    def embed_and_scores(self, windows: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Both outputs with one inference per window where the model allows it (the device path)."""
        w = self._check(windows)
        embs, scores, lat = [], [], []
        for i in range(len(w)):
            t0 = time.perf_counter()
            e, s = self._both_batch(w[i: i + 1])
            lat.append(time.perf_counter() - t0)
            embs.append(np.asarray(e, np.float32).reshape(-1))
            scores.append(np.asarray(s, np.float32).reshape(-1))
        self.last_latency_s = lat
        return np.stack(embs), np.stack(scores)

    def top_k(self, scores: np.ndarray, top_k: int = 5) -> list[list[tuple[str, float]]]:
        out = []
        for row in np.atleast_2d(scores):
            idx = np.argsort(-row)[:top_k]
            out.append([(self.labels[i], float(row[i])) for i in idx])
        return out

    def scores(self, windows: np.ndarray) -> np.ndarray:
        return self._timed(self._scores_batch, windows)

    def classify(self, windows: np.ndarray, top_k: int = 5) -> list[list[tuple[str, float]]]:
        return self.top_k(self.scores(windows), top_k)

    def describe(self) -> dict:
        return {
            "model_id": self.model_id,
            "version": self.model_version,
            "sample_rate": self.sample_rate,
            "window_seconds": round(self.window_seconds, 4),
            "embedding_dim": self.embedding_dim,
            "classes": len(self.labels),
            "source": self.source,
            "license": self.license,
            "input": self.input_format,
        }


# ------------------------------------------------------------------ registry

@dataclass
class _Entry:
    factory: Callable[[int | None], BaseAudioModel]
    instance: BaseAudioModel | None = None
    error: str | None = None


@dataclass
class ModelRegistry:
    threads: int | None = None
    _entries: dict[str, _Entry] = field(default_factory=dict)

    def register(self, model_id: str, factory: Callable[[int | None], BaseAudioModel]) -> None:
        self._entries[model_id] = _Entry(factory)

    @property
    def ids(self) -> list[str]:
        return list(self._entries)

    def get(self, model_id: str) -> BaseAudioModel:
        """Load lazily. Raises ModelUnavailable with a readable reason (and remembers it)."""
        if model_id not in self._entries:
            raise ModelUnavailable(f"unknown model id '{model_id}'. Known: {', '.join(self.ids)}")
        e = self._entries[model_id]
        if e.instance is not None:
            return e.instance
        if e.error:
            raise ModelUnavailable(e.error)
        try:
            m = e.factory(self.threads)
            m.load()
            e.instance = m
            return m
        except ModelUnavailable as err:
            e.error = str(err)
            raise
        except Exception as err:  # fail soft: keep other models working
            e.error = f"{type(err).__name__}: {err}"
            log.exception("model %s failed to load", model_id)
            raise ModelUnavailable(e.error) from err

    def status(self) -> dict[str, str]:
        out = {}
        for k, e in self._entries.items():
            out[k] = "loaded" if e.instance else (f"unavailable: {e.error}" if e.error else "not loaded")
        return out
