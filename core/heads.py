"""Few-shot heads on top of a frozen embedding model.

The backbone never changes. A head learns from single examples, so one solved
puzzle in the game is enough to teach the device a new sound.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

import numpy as np


def l2norm(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=np.float32)
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(n, 1e-12)


@dataclass
class Decision:
    label: str | None  # None means unknown
    best_label: str | None
    best: float
    second: float
    similarities: dict[str, float] = field(default_factory=dict)

    @property
    def margin(self) -> float:
        return self.best - self.second

    @property
    def recognized(self) -> bool:
        return self.label is not None


def decide(similarities: dict[str, float], t_known: float, margin: float) -> Decision:
    """Recognized if best >= t_known and best - second >= margin, otherwise unknown."""
    if not similarities:
        return Decision(None, None, 0.0, 0.0, {})
    ranked = sorted(similarities.items(), key=lambda kv: -kv[1])
    best_label, best = ranked[0]
    second = ranked[1][1] if len(ranked) > 1 else 0.0
    ok = best >= t_known and (best - second) >= margin
    return Decision(best_label if ok else None, best_label, float(best), float(second), dict(ranked))


class PrototypeMismatch(ValueError):
    pass


class Head(Protocol):
    model_id: str
    embedding_dim: int
    version: int

    def add_example(self, label: str, embedding: np.ndarray) -> None: ...
    def remove_last(self) -> bool: ...
    def reset(self) -> None: ...
    def similarities(self, embedding: np.ndarray) -> dict[str, float]: ...
    def export_json(self) -> str: ...
    def import_json(self, text: str) -> None: ...


class _HeadBase:
    kind = "base"

    def __init__(self, model_id: str, model_version: str, embedding_dim: int) -> None:
        self.model_id = model_id
        self.model_version = model_version
        self.embedding_dim = embedding_dim
        self.version = 0

    def _check_dim(self, embedding: np.ndarray) -> np.ndarray:
        e = np.asarray(embedding, dtype=np.float32).reshape(-1)
        if e.shape[0] != self.embedding_dim:
            raise ValueError(f"embedding has {e.shape[0]} dims, head expects {self.embedding_dim}")
        return l2norm(e)

    def _check_header(self, d: dict) -> None:
        if d.get("model_id") != self.model_id or int(d.get("embedding_dim", -1)) != self.embedding_dim:
            raise PrototypeMismatch(
                f"prototype file is for {d.get('model_id')} ({d.get('embedding_dim')}-d), "
                f"active model is {self.model_id} ({self.embedding_dim}-d)"
            )

    def predict(self, embedding: np.ndarray, t_known: float, margin: float) -> Decision:
        return decide(self.similarities(embedding), t_known, margin)

    def save(self, path: str | Path) -> Path:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(self.export_json(), encoding="utf-8")
        return p

    def load_file(self, path: str | Path) -> None:
        self.import_json(Path(path).read_text(encoding="utf-8"))

    def _header(self) -> dict:
        return {
            "format": "biospectra-prototypes/1",
            "head": self.kind,
            "model_id": self.model_id,
            "model_version": self.model_version,
            "embedding_dim": self.embedding_dim,
            "version": self.version,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }


class PrototypeHead(_HeadBase):
    """Each class is the mean of its L2-normalised embeddings, compared by cosine similarity."""

    kind = "prototype"

    def __init__(self, model_id: str, model_version: str, embedding_dim: int) -> None:
        super().__init__(model_id, model_version, embedding_dim)
        self._sums: dict[str, np.ndarray] = {}
        self._counts: dict[str, int] = {}
        self._history: list[tuple[str, np.ndarray]] = []

    @property
    def classes(self) -> dict[str, int]:
        return dict(self._counts)

    def add_example(self, label: str, embedding: np.ndarray) -> None:
        e = self._check_dim(embedding)
        self._sums[label] = self._sums.get(label, np.zeros(self.embedding_dim, np.float32)) + e
        self._counts[label] = self._counts.get(label, 0) + 1
        self._history.append((label, e))
        self.version += 1

    def remove_last(self) -> bool:
        if not self._history:
            return False
        label, e = self._history.pop()
        self._sums[label] -= e
        self._counts[label] -= 1
        if self._counts[label] <= 0:
            del self._sums[label], self._counts[label]
        self.version += 1
        return True

    def reset(self) -> None:
        self._sums.clear()
        self._counts.clear()
        self._history.clear()
        self.version += 1

    def prototypes(self) -> dict[str, np.ndarray]:
        return {k: l2norm(v / self._counts[k]) for k, v in self._sums.items()}

    def similarities(self, embedding: np.ndarray) -> dict[str, float]:
        e = self._check_dim(embedding)
        return {k: float(p @ e) for k, p in self.prototypes().items()}

    def export_json(self) -> str:
        d = self._header()
        d["classes"] = {
            k: {"count": self._counts[k], "mean": (self._sums[k] / self._counts[k]).round(6).tolist()}
            for k in self._sums
        }
        return json.dumps(d)

    def import_json(self, text: str) -> None:
        d = json.loads(text)
        self._check_header(d)
        self._sums = {k: np.asarray(v["mean"], np.float32) * int(v["count"]) for k, v in d["classes"].items()}
        self._counts = {k: int(v["count"]) for k, v in d["classes"].items()}
        self._history.clear()  # undo does not reach across imports
        self.version = int(d.get("version", 0))


class KNNHead(_HeadBase):
    """Stores every labelled embedding. Majority vote of the k nearest decides the label.

    `similarities` reports, per class, the mean similarity of that class's members
    among the k nearest (0 if absent), so it plugs into the same decision rule.
    """

    kind = "knn"

    def __init__(self, model_id: str, model_version: str, embedding_dim: int, k: int = 3) -> None:
        super().__init__(model_id, model_version, embedding_dim)
        self.k = k
        self._items: list[tuple[str, np.ndarray]] = []

    @property
    def classes(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for label, _ in self._items:
            out[label] = out.get(label, 0) + 1
        return out

    def add_example(self, label: str, embedding: np.ndarray) -> None:
        self._items.append((label, self._check_dim(embedding)))
        self.version += 1

    def remove_last(self) -> bool:
        if not self._items:
            return False
        self._items.pop()
        self.version += 1
        return True

    def reset(self) -> None:
        self._items.clear()
        self.version += 1

    def similarities(self, embedding: np.ndarray) -> dict[str, float]:
        if not self._items:
            return {}
        e = self._check_dim(embedding)
        sims = np.array([v @ e for _, v in self._items])
        top = np.argsort(-sims)[: self.k]
        votes: dict[str, list[float]] = {}
        for i in top:
            votes.setdefault(self._items[i][0], []).append(float(sims[i]))
        out = {label: 0.0 for label in self.classes}
        # weight by vote share so the majority wins, keep the scale of a cosine similarity
        for label, s in votes.items():
            out[label] = float(np.mean(s)) * len(s) / len(top)
        return out

    def export_json(self) -> str:
        d = self._header()
        d["k"] = self.k
        d["items"] = [{"label": label, "embedding": v.round(6).tolist()} for label, v in self._items]
        return json.dumps(d)

    def import_json(self, text: str) -> None:
        d = json.loads(text)
        self._check_header(d)
        self.k = int(d.get("k", self.k))
        self._items = [(it["label"], l2norm(np.asarray(it["embedding"], np.float32))) for it in d["items"]]
        self.version = int(d.get("version", 0))


def make_head(kind: str, model_id: str, model_version: str, embedding_dim: int, k: int = 3) -> PrototypeHead | KNNHead:
    if kind == "knn":
        return KNNHead(model_id, model_version, embedding_dim, k)
    return PrototypeHead(model_id, model_version, embedding_dim)
