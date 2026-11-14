"""Server-side state of the bench: models, cached analyses and one prototype store per model.

The bench is a local single-user tool, so one shared session is enough.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

from core.audio import load_audio
from core.config import load_config
from core.gates import PrivacyGate, PrivacyResult
from core.heads import Decision, KNNHead, PrototypeHead, decide, make_head
from core.models import build_registry
from core.models.base import ModelUnavailable
from core.pipeline import ClipAnalysis, analyze

log = logging.getLogger("biospectra.bench")
KINDS = ("prototype", "knn")


class BenchSession:
    def __init__(self) -> None:
        self.cfg = load_config()
        self.registry = build_registry(threads=self.cfg["runtime"]["threads"], enabled=self.cfg["models"]["enabled"])
        self._audio: dict[str, tuple[np.ndarray, int]] = {}
        self._analyses: dict[tuple[str, str], ClipAnalysis] = {}
        self.heads: dict[str, dict[str, PrototypeHead | KNNHead]] = {}
        self._prev: dict[str, dict[str, str]] = {}
        self._privacy: PrivacyGate | None = None
        self.privacy_error: str | None = None

    # ------------------------------------------------------------ audio + analysis
    def audio(self, path: str) -> tuple[np.ndarray, int]:
        if path not in self._audio:
            self._audio[path] = load_audio(path)
        return self._audio[path]

    def duration(self, path: str) -> float:
        x, sr = self.audio(path)
        return len(x) / sr

    def analysis(self, path: str, model_id: str) -> ClipAnalysis:
        key = (path, model_id)
        if key not in self._analyses:
            x, sr = self.audio(path)
            self._analyses[key] = analyze(
                self.registry.get(model_id), x, sr,
                energy_dbfs=self.cfg["gates"]["energy_dbfs"], hop_fraction=self.cfg["runtime"]["hop_fraction"],
            )
        return self._analyses[key]

    def privacy(self, path: str) -> PrivacyResult | None:
        p = self.cfg["gates"]["privacy"]
        if self._privacy is None and self.privacy_error is None:
            for mid in (p["model_id"], "yamnet-tflite"):
                try:
                    self._privacy = PrivacyGate.from_config(self.registry.get(mid), p)
                    break
                except ModelUnavailable as e:
                    self.privacy_error = f"{mid}: {e}"
            if self._privacy is not None:
                self.privacy_error = None
        if self._privacy is None:
            return None
        x, sr = self.audio(path)
        return self._privacy.check(x, sr)

    # ------------------------------------------------------------ prototype stores
    def head(self, model_id: str, kind: str) -> PrototypeHead | KNNHead:
        if model_id not in self.heads:
            m = self.registry.get(model_id)
            k = self.cfg["head"]["knn_k"]
            self.heads[model_id] = {kd: make_head(kd, m.model_id, m.model_version, m.embedding_dim, k) for kd in KINDS}
        return self.heads[model_id][kind]

    def query(self, path: str, model_id: str, mode: str, t: float) -> tuple[np.ndarray, bool, str]:
        """Embedding of the whole clip or of the window that contains time t."""
        a = self.analysis(path, model_id)
        if mode == "whole":
            return a.clip_embedding(), bool(a.energy_ok.any()), "whole clip"
        i = int(np.clip(np.searchsorted(a.starts, t, side="right") - 1, 0, len(a.starts) - 1))
        start = a.starts[i]
        return a.embeddings[i], bool(a.energy_ok[i]), f"window {i} ({start:.2f}–{start + a.window_seconds:.2f} s)"

    def _snapshot(self, model_id: str) -> None:
        self._prev[model_id] = {kd: self.head(model_id, kd).export_json() for kd in KINDS}

    def add_example(self, path: str, model_ids: list[str], label: str, mode: str, t: float) -> list[str]:
        msgs = []
        for mid in model_ids:
            try:
                e, _, where = self.query(path, mid, mode, t)
            except ModelUnavailable as err:
                msgs.append(f"{mid}: unavailable ({err})")
                continue
            self._snapshot(mid)
            for kd in KINDS:
                self.head(mid, kd).add_example(label, e)
            msgs.append(f"{mid}: added '{label}' from {where}")
        return msgs

    def undo(self, model_ids: list[str]) -> list[str]:
        msgs = []
        for mid in model_ids:
            if mid not in self.heads:
                continue
            self._snapshot(mid)
            ok = all(self.head(mid, kd).remove_last() for kd in KINDS)
            msgs.append(f"{mid}: {'removed last example' if ok else 'nothing to undo'}")
        return msgs

    def reset(self, model_ids: list[str]) -> list[str]:
        for mid in model_ids:
            if mid in self.heads:
                self._snapshot(mid)
                for kd in KINDS:
                    self.head(mid, kd).reset()
        return [f"{mid}: store cleared" for mid in model_ids if mid in self.heads]

    def import_file(self, path: str, kind: str) -> str:
        import json

        try:
            d = json.loads(Path(path).read_text(encoding="utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return f"{Path(path).name}: not a prototype JSON file"
        mid = d.get("model_id")
        if not mid:
            return f"{Path(path).name}: no model_id in file"
        kind = d.get("head", kind)
        try:
            h = self.head(mid, kind)
        except ModelUnavailable as e:
            return f"{Path(path).name}: model {mid} unavailable ({e})"
        self._snapshot(mid)
        try:
            h.import_json(json.dumps(d))
        except ValueError as e:
            return f"{Path(path).name}: rejected. {e}"
        return f"{Path(path).name}: loaded {len(h.classes)} classes into {mid} ({kind}), version {h.version}"

    def before_after(self, path: str, model_ids: list[str], kind: str, mode: str, t: float):
        """Similarities of the current query under the store before and after the last change."""
        rows: dict[str, tuple[dict[str, float], dict[str, float]]] = {}
        for mid in model_ids:
            if mid not in self.heads:
                continue
            try:
                e, _, _ = self.query(path, mid, mode, t)
            except ModelUnavailable:
                continue
            cur = self.head(mid, kind)
            after = cur.similarities(e) if cur.classes else {}
            before = {}
            prev = self._prev.get(mid, {}).get(kind)
            if prev:
                m = self.registry.get(mid)
                tmp = make_head(kind, m.model_id, m.model_version, m.embedding_dim, self.cfg["head"]["knn_k"])
                tmp.import_json(prev)
                before = tmp.similarities(e) if tmp.classes else {}
            rows[mid] = (before, after)
        return rows

    def decision(self, path: str, model_id: str, kind: str, mode: str, t: float, t_known: float, margin: float) -> tuple[Decision, bool]:
        """Head decision for the query. An empty store means every real sound is unknown."""
        e, energy_ok, _ = self.query(path, model_id, mode, t)
        sims = self.head(model_id, kind).similarities(e) if model_id in self.heads else {}
        return decide(sims, t_known, margin), energy_ok
