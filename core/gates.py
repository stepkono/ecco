"""Energy and privacy gates. A clip must pass both before it is embedded or queued."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np

from .audio import make_windows, resample, rms_dbfs
from .models.base import BaseAudioModel

log = logging.getLogger("biospectra.gates")


@dataclass
class EnergyResult:
    passed: bool
    level_dbfs: float


def energy_gate(window: np.ndarray, threshold_dbfs: float) -> EnergyResult:
    level = rms_dbfs(window)
    return EnergyResult(level >= threshold_dbfs, level)


@dataclass
class PrivacyResult:
    speech: bool
    score: float  # combined speech score of the most speech-like window
    per_class: dict[str, float] = field(default_factory=dict)  # max over windows
    per_window: list[float] = field(default_factory=list)


class PrivacyGate:
    """Drops clips with human speech, decided by YAMNet's speech-related classes."""

    def __init__(self, model: BaseAudioModel, classes: list[str], threshold: float, combine: str = "max",
                 min_windows: int = 1, hard_threshold: float | None = None) -> None:
        self.model = model
        self.threshold = threshold
        self.combine = combine
        self.min_windows = min_windows
        self.hard_threshold = hard_threshold if hard_threshold is not None else threshold
        model.load()
        lookup = {name: i for i, name in enumerate(model.labels)}
        missing = [c for c in classes if c not in lookup]
        if missing:
            log.warning("privacy classes not in %s class map, ignored: %s", model.model_id, missing)
        self.classes = [c for c in classes if c in lookup]
        self.indices = np.array([lookup[c] for c in self.classes], dtype=int)

    def check(self, audio: np.ndarray, sr: int) -> PrivacyResult:
        x = resample(audio, sr, self.model.sample_rate)
        w = make_windows(x, self.model.sample_rate, self.model.window_seconds)
        scores = self.model.scores(w.data)[:, self.indices]  # (n, k)
        combined = scores.sum(1) if self.combine == "sum" else scores.max(1)
        best = float(combined.max()) if len(combined) else 0.0
        sustained = int((combined >= self.threshold).sum()) >= self.min_windows
        speech = sustained or best >= self.hard_threshold
        per_class = {c: float(scores[:, j].max()) for j, c in enumerate(self.classes)}
        return PrivacyResult(speech, best, per_class, combined.tolist())

    @classmethod
    def from_config(cls, model: BaseAudioModel, p: dict) -> "PrivacyGate":
        return cls(model, p["classes"], p["threshold"], p.get("combine", "max"), p.get("min_windows", 1),
                   p.get("hard_threshold"))
