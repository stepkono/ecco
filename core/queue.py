"""Persistent queue of uncertain clips (WAV files + SQLite rows). Survives restarts."""

from __future__ import annotations

import json
import functools
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from .audio import save_wav

SCHEMA = """
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,
  created_at REAL NOT NULL,
  device_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  wav_path TEXT NOT NULL,
  sample_rate INTEGER NOT NULL,
  embedding BLOB NOT NULL,
  best_guess TEXT,
  best_score REAL,
  scores_json TEXT,
  uploaded INTEGER NOT NULL DEFAULT 0
);
"""


@dataclass
class QueuedClip:
    id: str
    created_at: float
    device_id: str
    model_id: str
    wav_path: str
    sample_rate: int
    embedding: np.ndarray
    best_guess: str | None
    best_score: float | None
    scores: dict
    uploaded: bool


def _locked(fn):
    """One SQLite call at a time: the listener thread and the console's web threads share the queue."""
    @functools.wraps(fn)
    def wrapper(self, *a, **kw):
        with self._lock:
            return fn(self, *a, **kw)
    return wrapper


class ClipQueue:
    def __init__(self, folder: str | Path) -> None:
        self._lock = threading.RLock()
        self.folder = Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.folder / "queue.db", check_same_thread=False)
        self.db.executescript(SCHEMA)

    @_locked
    def enqueue(self, audio: np.ndarray, sr: int, embedding: np.ndarray, *, device_id: str, model_id: str,
                best_guess: str | None, best_score: float | None, scores: dict | None = None) -> str:
        clip_id = uuid.uuid4().hex[:12]
        wav = save_wav(self.folder / f"{clip_id}.wav", audio, sr)
        self.db.execute(
            "INSERT INTO clips VALUES (?,?,?,?,?,?,?,?,?,?,0)",
            (clip_id, time.time(), device_id, model_id, str(wav), sr,
             np.asarray(embedding, np.float32).tobytes(), best_guess, best_score, json.dumps(scores or {})),
        )
        self.db.commit()
        return clip_id

    def _row(self, r: tuple) -> QueuedClip:
        return QueuedClip(r[0], r[1], r[2], r[3], r[4], r[5], np.frombuffer(r[6], np.float32), r[7], r[8],
                          json.loads(r[9] or "{}"), bool(r[10]))

    @_locked
    def pending(self, limit: int = 50) -> list[QueuedClip]:
        rows = self.db.execute("SELECT * FROM clips WHERE uploaded=0 ORDER BY created_at LIMIT ?", (limit,))
        return [self._row(r) for r in rows]

    @_locked
    def all(self, limit: int = 500) -> list[QueuedClip]:
        rows = self.db.execute("SELECT * FROM clips ORDER BY created_at DESC LIMIT ?", (limit,))
        return [self._row(r) for r in rows]

    @_locked
    def get(self, clip_id: str) -> QueuedClip | None:
        r = self.db.execute("SELECT * FROM clips WHERE id=?", (clip_id,)).fetchone()
        return self._row(r) if r else None

    @_locked
    def delete(self, clip_id: str) -> bool:
        clip = self.get(clip_id)
        if not clip:
            return False
        Path(clip.wav_path).unlink(missing_ok=True)
        self.db.execute("DELETE FROM clips WHERE id=?", (clip_id,))
        self.db.commit()
        return True

    @_locked
    def mark_uploaded(self, clip_id: str) -> None:
        self.db.execute("UPDATE clips SET uploaded=1 WHERE id=?", (clip_id,))
        self.db.commit()

    @_locked
    def count(self, only_pending: bool = False) -> int:
        q = "SELECT COUNT(*) FROM clips" + (" WHERE uploaded=0" if only_pending else "")
        return int(self.db.execute(q).fetchone()[0])
