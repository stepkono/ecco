"""SQLite storage for the backend: devices, clips, labels, players, gold clips, prototypes, events."""

from __future__ import annotations

import json
import sqlite3
import threading
import time
import uuid
from pathlib import Path

import numpy as np

SCHEMA = """
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY, name TEXT, location TEXT, last_seen REAL, proto_version INTEGER
);
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY, device_id TEXT, created_at REAL, received_at REAL NOT NULL,
  audio_path TEXT NOT NULL, sample_rate INTEGER, duration_s REAL, embedding BLOB, model_id TEXT,
  device_guess TEXT, device_score REAL, scores_json TEXT, heard_count INTEGER DEFAULT 1,
  novelty REAL, quality REAL, timeline_json TEXT,
  status TEXT NOT NULL DEFAULT 'open',          -- open | solved | rejected
  accepted_label TEXT
);
CREATE TABLE IF NOT EXISTS labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT, clip_id TEXT NOT NULL, player_id TEXT NOT NULL,
  label TEXT NOT NULL, mask_json TEXT, created_at REAL NOT NULL, gold_correct INTEGER
);
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, nickname TEXT, reliability REAL NOT NULL DEFAULT 0.5,
  solved INTEGER NOT NULL DEFAULT 0, created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS gold_clips (clip_id TEXT PRIMARY KEY, true_label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prototypes (
  model_id TEXT NOT NULL, version INTEGER NOT NULL, json TEXT NOT NULL, created_at REAL NOT NULL,
  PRIMARY KEY (model_id, version)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, payload TEXT, created_at REAL NOT NULL
);
"""


class Store:
    def __init__(self, folder: str | Path) -> None:
        self.folder = Path(folder)
        (self.folder / "clips").mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.db = sqlite3.connect(self.folder / "backend.db", check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        if "proto_version" not in {r["name"] for r in self.db.execute("PRAGMA table_info(devices)")}:
            self.db.execute("ALTER TABLE devices ADD COLUMN proto_version INTEGER")
        self.db.commit()

    def q(self, sql: str, args: tuple = ()) -> list[sqlite3.Row]:
        with self.lock:
            return self.db.execute(sql, args).fetchall()

    def one(self, sql: str, args: tuple = ()) -> sqlite3.Row | None:
        with self.lock:
            return self.db.execute(sql, args).fetchone()

    def run(self, sql: str, args: tuple = ()) -> int:
        with self.lock:
            cur = self.db.execute(sql, args)
            self.db.commit()
            return cur.lastrowid

    # ------------------------------------------------------------ devices + clips
    def touch_device(self, device_id: str, name: str | None = None, location: str | None = None) -> None:
        self.run("INSERT INTO devices (id, name, location, last_seen) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET "
                 "last_seen=excluded.last_seen, name=COALESCE(excluded.name, devices.name), "
                 "location=COALESCE(excluded.location, devices.location)", (device_id, name, location, time.time()))

    def add_clip(self, meta: dict, wav: bytes, device_id: str) -> tuple[str, bool]:
        """Store an uploaded event. Returns (clip id, created). Re-uploads of the same id are ignored."""
        cid = str(meta.get("clip_id") or uuid.uuid4().hex[:12])
        if self.one("SELECT id FROM clips WHERE id=?", (cid,)):
            return cid, False
        path = self.folder / "clips" / f"{cid}.wav"
        path.write_bytes(wav)
        emb = meta.get("embedding")
        self.run(
            "INSERT INTO clips (id, device_id, created_at, received_at, audio_path, sample_rate, duration_s, embedding,"
            " model_id, device_guess, device_score, scores_json, heard_count, novelty, quality, timeline_json)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (cid, device_id, meta.get("created_at"), time.time(), str(path), meta.get("sample_rate"),
             meta.get("duration_s"), np.asarray(emb, np.float32).tobytes() if emb else None, meta.get("model_id"),
             meta.get("device_guess"), meta.get("device_score"), json.dumps(meta.get("scores") or {}),
             int(meta.get("heard_count") or 1), meta.get("novelty"), meta.get("quality_dbfs"),
             json.dumps(meta.get("timeline") or [])),
        )
        return cid, True

    def clip(self, cid: str) -> sqlite3.Row | None:
        return self.one("SELECT * FROM clips WHERE id=?", (cid,))

    def gold_label(self, cid: str) -> str | None:
        r = self.one("SELECT true_label FROM gold_clips WHERE clip_id=?", (cid,))
        return r["true_label"] if r else None

    # ------------------------------------------------------------ players + labels
    def add_player(self, nickname: str) -> str:
        pid = uuid.uuid4().hex[:10]
        self.run("INSERT INTO players (id, nickname, created_at) VALUES (?,?,?)", (pid, nickname, time.time()))
        return pid

    def player(self, pid: str) -> sqlite3.Row | None:
        return self.one("SELECT * FROM players WHERE id=?", (pid,))

    def add_label(self, cid: str, pid: str, label: str, mask: dict | None, gold_correct: bool | None) -> int:
        return self.run("INSERT INTO labels (clip_id, player_id, label, mask_json, created_at, gold_correct) "
                        "VALUES (?,?,?,?,?,?)", (cid, pid, label, json.dumps(mask) if mask else None, time.time(),
                                                 None if gold_correct is None else int(gold_correct)))

    # ------------------------------------------------------------ prototypes + events
    def latest_prototypes(self, model_id: str) -> sqlite3.Row | None:
        return self.one("SELECT * FROM prototypes WHERE model_id=? ORDER BY version DESC LIMIT 1", (model_id,))

    def first_prototypes(self, model_id: str) -> sqlite3.Row | None:
        """The version the backend was seeded with."""
        return self.one("SELECT * FROM prototypes WHERE model_id=? ORDER BY version ASC LIMIT 1", (model_id,))

    def save_prototypes(self, model_id: str, version: int, text: str) -> None:
        self.run("INSERT OR REPLACE INTO prototypes (model_id, version, json, created_at) VALUES (?,?,?,?)",
                 (model_id, version, text, time.time()))

    def add_event(self, kind: str, payload: dict) -> dict:
        now = time.time()
        eid = self.run("INSERT INTO events (type, payload, created_at) VALUES (?,?,?)", (kind, json.dumps(payload), now))
        return {"id": eid, "type": kind, "created_at": now, **payload}

    def recent_events(self, limit: int = 50) -> list[dict]:
        rows = self.q("SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,))
        return [{"id": r["id"], "type": r["type"], "created_at": r["created_at"], **json.loads(r["payload"] or "{}")}
                for r in rows][::-1]
