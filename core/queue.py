"""Persistent queue of uncertain sound events (WAV files + SQLite rows). Survives restarts.

An entry is one event: a stretch of audio the device could not recognize, with
some context before and after. The same sound heard again is not saved twice:
`heard_count` goes up instead, and the clearest recording is kept.
"""

from __future__ import annotations

import functools
import json
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass, field
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
# columns added for events (older queue databases are migrated in place)
EVENT_COLUMNS = {
    "duration_s": "REAL",
    "heard_count": "INTEGER NOT NULL DEFAULT 1",
    "last_heard": "REAL",
    "novelty": "REAL",
    "quality": "REAL",
    "timeline_json": "TEXT",
    "segments_blob": "BLOB",  # (segments, d) float32 fingerprints of the event's uncertain segments
}


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
    duration_s: float | None = None
    heard_count: int = 1
    last_heard: float | None = None
    novelty: float | None = None
    quality: float | None = None
    timeline: list = field(default_factory=list)
    segment_embeddings: np.ndarray | None = None


def _locked(fn):
    """One SQLite call at a time: the listener thread and the console's web threads share the queue."""

    @functools.wraps(fn)
    def wrapper(self, *a, **kw):
        with self._lock:
            return fn(self, *a, **kw)

    return wrapper


def _unit(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, np.float32).reshape(-1)
    return v / max(float(np.linalg.norm(v)), 1e-12)


def _blob(a: np.ndarray | None) -> bytes | None:
    if a is None:
        return None
    a = np.atleast_2d(np.asarray(a, np.float32))
    return np.int32(a.shape[1]).tobytes() + a.tobytes()


def _unblob(b: bytes | None) -> np.ndarray | None:
    if not b:
        return None
    d = int(np.frombuffer(b[:4], np.int32)[0])
    return np.frombuffer(b[4:], np.float32).reshape(-1, d)


class ClipQueue:
    def __init__(self, folder: str | Path) -> None:
        self._lock = threading.RLock()
        self.folder = Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.folder / "queue.db", check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        have = {r["name"] for r in self.db.execute("PRAGMA table_info(clips)")}
        for col, decl in EVENT_COLUMNS.items():
            if col not in have:
                self.db.execute(f"ALTER TABLE clips ADD COLUMN {col} {decl}")
        self.db.commit()

    # ------------------------------------------------------------ write
    @_locked
    def enqueue(self, audio: np.ndarray, sr: int, embedding: np.ndarray, *, device_id: str, model_id: str,
                best_guess: str | None, best_score: float | None, scores: dict | None = None,
                novelty: float | None = None, quality: float | None = None, timeline: list | None = None,
                segment_embeddings: np.ndarray | None = None) -> str:
        clip_id = uuid.uuid4().hex[:12]
        wav = save_wav(self.folder / f"{clip_id}.wav", audio, sr)
        now = time.time()
        self.db.execute(
            "INSERT INTO clips (id, created_at, device_id, model_id, wav_path, sample_rate, embedding, best_guess,"
            " best_score, scores_json, uploaded, duration_s, heard_count, last_heard, novelty, quality, timeline_json,"
            " segments_blob) VALUES (?,?,?,?,?,?,?,?,?,?,0,?,1,?,?,?,?,?)",
            (clip_id, now, device_id, model_id, str(wav), sr, np.asarray(embedding, np.float32).tobytes(),
             best_guess, best_score, json.dumps(scores or {}), round(len(audio) / sr, 2), now, novelty, quality,
             json.dumps(timeline or []), _blob(segment_embeddings)),
        )
        self.db.commit()
        return clip_id

    @_locked
    def record_repeat(self, clip_id: str, *, audio: np.ndarray | None = None, sr: int | None = None,
                      embedding: np.ndarray | None = None, quality: float | None = None,
                      best_guess: str | None = None, best_score: float | None = None, scores: dict | None = None,
                      novelty: float | None = None, timeline: list | None = None,
                      segment_embeddings: np.ndarray | None = None) -> bool:
        """The same sound was heard again. Count it. If the new recording is clearer and the
        old one is not uploaded yet, keep the new audio instead. Returns True if replaced."""
        clip = self.get(clip_id)
        if clip is None:
            return False
        now = time.time()
        self.db.execute("UPDATE clips SET heard_count = heard_count + 1, last_heard = ? WHERE id = ?", (now, clip_id))
        replace = (audio is not None and not clip.uploaded and quality is not None
                   and (clip.quality is None or quality > clip.quality))
        if replace:
            save_wav(clip.wav_path, audio, sr)
            self.db.execute(
                "UPDATE clips SET sample_rate=?, embedding=?, best_guess=?, best_score=?, scores_json=?, duration_s=?,"
                " novelty=?, quality=?, timeline_json=?, segments_blob=? WHERE id=?",
                (sr, np.asarray(embedding, np.float32).tobytes(), best_guess, best_score, json.dumps(scores or {}),
                 round(len(audio) / sr, 2), novelty, quality, json.dumps(timeline or []), _blob(segment_embeddings),
                 clip_id),
            )
        self.db.commit()
        return replace

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

    # ------------------------------------------------------------ read
    def _row(self, r: sqlite3.Row) -> QueuedClip:
        keys = r.keys()
        get = lambda k, d=None: r[k] if k in keys and r[k] is not None else d  # noqa: E731
        return QueuedClip(
            r["id"], r["created_at"], r["device_id"], r["model_id"], r["wav_path"], r["sample_rate"],
            np.frombuffer(r["embedding"], np.float32), r["best_guess"], r["best_score"],
            json.loads(r["scores_json"] or "{}"), bool(r["uploaded"]),
            get("duration_s"), int(get("heard_count", 1)), get("last_heard"), get("novelty"), get("quality"),
            json.loads(get("timeline_json", "[]")), _unblob(get("segments_blob")),
        )

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
    def count(self, only_pending: bool = False) -> int:
        q = "SELECT COUNT(*) FROM clips" + (" WHERE uploaded=0" if only_pending else "")
        return int(self.db.execute(q).fetchone()[0])

    @_locked
    def count_since(self, since: float) -> int:
        return int(self.db.execute("SELECT COUNT(*) FROM clips WHERE created_at >= ?", (since,)).fetchone()[0])

    @_locked
    def find_repeat(self, segments: np.ndarray, since: float, similarity: float) -> tuple[QueuedClip | None, float, float]:
        """The queued event that already covers most of these segments.

        For every new segment, its closest segment in a candidate event counts as a match
        if the similarity is at least `similarity`. Returns (event, coverage, mean best
        similarity) for the candidate with the highest coverage (share of matched segments).
        """
        new = np.atleast_2d(np.asarray(segments, np.float32))
        new = new / np.maximum(np.linalg.norm(new, axis=1, keepdims=True), 1e-12)
        best, best_cov, best_sim = None, -1.0, 0.0
        for r in self.db.execute("SELECT * FROM clips WHERE COALESCE(last_heard, created_at) >= ?", (since,)):
            c = self._row(r)
            old = c.segment_embeddings if c.segment_embeddings is not None else np.atleast_2d(c.embedding)
            if old.shape[1] != new.shape[1]:
                continue
            old = old / np.maximum(np.linalg.norm(old, axis=1, keepdims=True), 1e-12)
            m = (new @ old.T).max(axis=1)
            cov, sim = float(np.mean(m >= similarity)), float(m.mean())
            if (cov, sim) > (best_cov, best_sim):
                best, best_cov, best_sim = c, cov, sim
        return best, best_cov, best_sim

    @_locked
    def most_similar(self, embedding: np.ndarray, since: float) -> tuple[QueuedClip | None, float]:
        """The queued event (newer than `since`) whose fingerprint is closest to this one."""
        e = _unit(embedding)
        best, best_sim = None, -1.0
        for r in self.db.execute("SELECT * FROM clips WHERE COALESCE(last_heard, created_at) >= ?", (since,)):
            c = self._row(r)
            if c.embedding.shape != e.shape:
                continue
            s = float(_unit(c.embedding) @ e)
            if s > best_sim:
                best, best_sim = c, s
        return best, best_sim

    @_locked
    def least_novel_pending_since(self, since: float) -> QueuedClip | None:
        r = self.db.execute("SELECT * FROM clips WHERE uploaded=0 AND created_at >= ? ORDER BY COALESCE(novelty, 0) "
                            "ASC LIMIT 1", (since,)).fetchone()
        return self._row(r) if r else None
