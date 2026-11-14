"""Run one model over a clip: resample, window, energy gate, scores, embeddings.

Used by the bench now, and by the device and backend later.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

import numpy as np

from .audio import make_windows, resample
from .gates import energy_gate
from .heads import l2norm
from .models.base import BaseAudioModel


@dataclass
class ClipAnalysis:
    model_id: str
    starts: np.ndarray  # window start times (s)
    window_seconds: float
    top: list[list[tuple[str, float]]]  # top-k per window
    embeddings: np.ndarray  # (n, d), L2-normalised
    energy_ok: np.ndarray  # (n,) bool
    level_dbfs: np.ndarray  # (n,)
    latency_s: list[float] = field(default_factory=list)  # per window, one inference for both outputs
    total_s: float = 0.0
    scores: np.ndarray | None = None  # (n, classes) raw class scores, reused by the privacy gate

    def clip_embedding(self) -> np.ndarray:
        """Mean of the normalised embeddings of non-silent windows (all windows if every one is silent)."""
        sel = self.embeddings[self.energy_ok] if self.energy_ok.any() else self.embeddings
        return l2norm(sel.mean(0))

    def window_embedding(self, i: int) -> np.ndarray:
        return self.embeddings[i]


def analyze(model: BaseAudioModel, audio: np.ndarray, sr: int, *, top_k: int = 5, energy_dbfs: float = -55.0,
            hop_fraction: float = 1.0) -> ClipAnalysis:
    t0 = time.perf_counter()
    model.load()
    x = resample(audio, sr, model.sample_rate)
    w = make_windows(x, model.sample_rate, model.window_seconds, model.window_seconds * hop_fraction)
    gates = [energy_gate(win, energy_dbfs) for win in w.data]
    emb, scores = model.embed_and_scores(w.data)
    top = model.top_k(scores, top_k)
    return ClipAnalysis(
        model_id=model.model_id,
        starts=w.starts,
        window_seconds=model.window_seconds,
        top=top,
        embeddings=l2norm(emb),
        energy_ok=np.array([g.passed for g in gates]),
        level_dbfs=np.array([g.level_dbfs for g in gates]),
        latency_s=list(model.last_latency_s),
        total_s=time.perf_counter() - t0,
        scores=scores,
    )
