"""Backend logic, independent of the web framework.

* receive sound events from listening posts
* hand out puzzles (open events, mixed with hidden gold clips)
* spectrogram for the game and preview of a carved selection
* labels -> consensus -> new prototype version for the device
"""

from __future__ import annotations

import io
import json
import logging
import queue as queue_mod
import random
import threading
import time

import numpy as np
import soundfile as sf

from core.audio import apply_mask, stft_spectrogram
from core.config import ROOT
from core.heads import PrototypeHead
from core.models import build_registry
from core.pipeline import analyze

from .store import Store

log = logging.getLogger("biospectra.backend")
NOISE, OTHER = "noise", "other"


class Bus:
    """Fan-out of events to every open Server-Sent-Events stream."""

    def __init__(self) -> None:
        self._subs: set[queue_mod.Queue] = set()
        self._lock = threading.Lock()

    def subscribe(self) -> queue_mod.Queue:
        q: queue_mod.Queue = queue_mod.Queue(maxsize=500)
        with self._lock:
            self._subs.add(q)
        return q

    def unsubscribe(self, q: queue_mod.Queue) -> None:
        with self._lock:
            self._subs.discard(q)

    def publish(self, event: dict) -> None:
        with self._lock:
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(event)
            except queue_mod.Full:
                pass


class Backend:
    def __init__(self, cfg: dict, store: Store) -> None:
        self.cfg = cfg
        self.b = cfg["backend"]
        self.store = store
        self.bus = Bus()
        self.model_id = self.b["model_id"]
        self._registry = build_registry(threads=cfg["runtime"]["threads"])
        self._model = None
        self._infer = threading.Lock()
        self._learn = threading.Lock()
        self._spec_cache: dict[str, tuple] = {}
        self.head = self._load_or_seed_head()

    # ------------------------------------------------------------ model + prototypes
    @property
    def model(self):
        if self._model is None:
            self._model = self._registry.get(self.model_id)
        return self._model

    def _load_or_seed_head(self) -> PrototypeHead:
        m = self.model
        head = PrototypeHead(m.model_id, m.model_version, m.embedding_dim)
        row = self.store.latest_prototypes(self.model_id)
        if row:
            head.import_json(row["json"])
            return head
        seed = ROOT / self.cfg["paths"]["prototypes"] / f"{self.model_id}.prototype.json"
        if seed.exists():
            head.import_json(seed.read_text(encoding="utf-8"))
            self.store.save_prototypes(self.model_id, head.version, head.export_json())
            self.emit("prototypes_seeded", {"version": head.version, "classes": head.classes, "from": seed.name})
        return head

    def emit(self, kind: str, payload: dict) -> dict:
        ev = self.store.add_event(kind, payload)
        self.bus.publish(ev)
        return ev

    @property
    def labels(self) -> list[str]:
        return list(self.b["labels"]) + [NOISE, OTHER]

    # ------------------------------------------------------------ clips from devices
    def receive_clip(self, device_id: str, meta: dict, wav: bytes) -> dict:
        self.store.touch_device(device_id)
        if meta.get("model_id") and meta["model_id"] != self.model_id:
            log.warning("clip from %s uses model %s, backend learns for %s", device_id, meta["model_id"], self.model_id)
        cid, created = self.store.add_clip(meta, wav, device_id)
        if created:
            self.emit("clip_received", {"clip_id": cid, "device_id": device_id, "duration_s": meta.get("duration_s"),
                                        "device_guess": meta.get("device_guess"), "heard_count": meta.get("heard_count")})
        return {"clip_id": cid, "created": created}

    def audio(self, cid: str) -> tuple[np.ndarray, int]:
        c = self.store.clip(cid)
        if c is None:
            raise KeyError(cid)
        x, sr = sf.read(c["audio_path"], dtype="float32", always_2d=True)
        return x.mean(axis=1), sr

    # ------------------------------------------------------------ puzzles
    def next_puzzle(self, player_id: str) -> dict | None:
        if self.store.player(player_id) is None:
            raise KeyError(f"unknown player {player_id}")
        done = {r["clip_id"] for r in self.store.q("SELECT clip_id FROM labels WHERE player_id=?", (player_id,))}
        gold = [r["clip_id"] for r in self.store.q("SELECT clip_id FROM gold_clips") if r["clip_id"] not in done]
        open_ = [r for r in self.store.q(
            "SELECT * FROM clips WHERE status='open' AND id NOT IN (SELECT clip_id FROM gold_clips) "
            "ORDER BY heard_count DESC, COALESCE(novelty, 0) DESC, received_at ASC") if r["id"] not in done]
        pick = None
        if gold and (not open_ or random.random() < float(self.b.get("gold_rate", 0.2))):
            pick = self.store.clip(random.choice(gold))
        elif open_:
            pick = open_[0]  # sounds heard most often first: one answer helps the device most there
        if pick is None:
            return None
        return {"clip_id": pick["id"], "duration_s": pick["duration_s"], "labels": self.labels,
                "audio_url": f"/clips/{pick['id']}/audio", "spectrogram_url": f"/clips/{pick['id']}/spectrogram"}

    # ------------------------------------------------------------ spectrogram + masks
    def _grids(self, cid: str):
        """Full STFT grid plus the pooled display grid (cached per clip)."""
        if cid in self._spec_cache:
            return self._spec_cache[cid]
        x, sr = self.audio(cid)
        s = stft_spectrogram(x, sr)
        rows = min(int(self.b.get("spectrogram_max_rows", 192)), s.db.shape[0])
        cols = min(int(self.b.get("spectrogram_max_cols", 640)), s.db.shape[1])
        f_starts = np.unique(np.linspace(0, s.db.shape[0], rows, endpoint=False).astype(int))
        t_starts = np.unique(np.linspace(0, s.db.shape[1], cols, endpoint=False).astype(int))
        pooled = np.maximum.reduceat(np.maximum.reduceat(s.db, f_starts, axis=0), t_starts, axis=1)
        out = (x, sr, s, f_starts, t_starts, pooled)
        self._spec_cache[cid] = out
        return out

    def spectrogram(self, cid: str) -> dict:
        x, sr, s, fs, ts, pooled = self._grids(cid)
        return {
            "clip_id": cid, "sample_rate": sr, "duration_s": round(len(x) / sr, 3),
            "rows": int(pooled.shape[0]), "cols": int(pooled.shape[1]),
            "freqs": [round(float(s.freqs[i]), 1) for i in fs],  # lower edge of each row, low to high
            "times": [round(float(s.times[j]), 3) for j in ts],  # start of each column
            "db": np.round(pooled, 1).tolist(),  # rows = frequency (low to high), cols = time
            "db_max": round(float(pooled.max()), 1),
            "mask_format": "grid: rows x cols of 0..1 on this grid, or boxes: [{t0, t1, f0, f1}] in s and Hz",
        }

    def full_mask(self, cid: str, mask: dict | None) -> np.ndarray | None:
        """Turn a game mask (display grid or boxes) into a mask on the full STFT grid."""
        if not mask:
            return None
        x, sr, s, fs, ts, pooled = self._grids(cid)
        full = np.zeros(s.db.shape, dtype=np.float32)
        if mask.get("grid") is not None:
            g = np.clip(np.asarray(mask["grid"], dtype=np.float32), 0, 1)
            if g.shape != pooled.shape:
                raise ValueError(f"mask grid is {g.shape}, spectrogram grid is {pooled.shape}")
            ri = np.searchsorted(fs, np.arange(s.db.shape[0]), side="right") - 1
            ci = np.searchsorted(ts, np.arange(s.db.shape[1]), side="right") - 1
            full = g[np.ix_(ri, ci)]
        for b in mask.get("boxes") or []:
            fr = (s.freqs >= float(b["f0"])) & (s.freqs <= float(b["f1"]))
            tr = (s.times >= float(b["t0"])) & (s.times <= float(b["t1"]))
            full[np.ix_(fr, tr)] = 1.0
        if not full.any():
            raise ValueError("the mask selects nothing")
        return full

    def preview(self, cid: str, mask: dict | None) -> bytes:
        x, sr, *_ = self._grids(cid)
        m = self.full_mask(cid, mask)
        y = apply_mask(x, sr, m) if m is not None else x
        buf = io.BytesIO()
        sf.write(buf, y, sr, format="WAV", subtype="PCM_16")
        return buf.getvalue()

    # ------------------------------------------------------------ labels -> prototypes
    def submit_label(self, cid: str, player_id: str, label: str, mask: dict | None) -> dict:
        clip = self.store.clip(cid)
        if clip is None:
            raise KeyError(f"unknown clip {cid}")
        player = self.store.player(player_id)
        if player is None:
            raise KeyError(f"unknown player {player_id}")
        if label not in self.labels:
            raise ValueError(f"label must be one of {self.labels}")
        if mask:
            self.full_mask(cid, mask)  # validate before storing
        truth = self.store.gold_label(cid)
        if truth is not None:  # hidden test clip: update reliability, never learn from it
            correct = label == truth
            self.store.add_label(cid, player_id, label, mask, correct)
            rel = self._update_reliability(player, correct)
            self.emit("gold_answered", {"clip_id": cid, "player_id": player_id, "correct": correct, "reliability": rel})
            return {"clip_id": cid, "gold": True, "correct": correct, "true_label": truth, "reliability": rel,
                    "accepted": False}
        self.store.add_label(cid, player_id, label, mask, None)
        self.store.run("UPDATE players SET solved = solved + 1 WHERE id=?", (player_id,))
        self.emit("label_submitted", {"clip_id": cid, "player_id": player_id, "label": label, "has_mask": bool(mask)})
        return {"clip_id": cid, "gold": False, **self._consensus(cid)}

    def _update_reliability(self, player, correct: bool) -> float:
        step = float(self.b.get("reliability_step", 0.2))
        rel = float(player["reliability"])
        rel = rel + step * ((1.0 if correct else 0.0) - rel)
        self.store.run("UPDATE players SET reliability=? WHERE id=?", (round(rel, 4), player["id"]))
        return round(rel, 4)

    def _consensus(self, cid: str) -> dict:
        need = 1 if self.b.get("demo_mode") else int(self.b.get("consensus_n", 2))
        min_rel = float(self.b.get("min_reliability", 0.4))
        rows = self.store.q("SELECT l.label, l.mask_json, p.reliability FROM labels l JOIN players p ON p.id = l.player_id "
                            "WHERE l.clip_id=? ORDER BY l.id", (cid,))
        votes: dict[str, list] = {}
        for r in rows:
            if r["reliability"] >= min_rel:
                votes.setdefault(r["label"], []).append(json.loads(r["mask_json"]) if r["mask_json"] else None)
        if not votes:
            return {"accepted": False, "votes": {}, "needed": need}
        label, masks = max(votes.items(), key=lambda kv: len(kv[1]))
        counts = {k: len(v) for k, v in votes.items()}
        if len(masks) < need or self.store.clip(cid)["status"] != "open":
            return {"accepted": False, "votes": counts, "needed": need}
        return {"accepted": True, "label": label, "votes": counts, "needed": need, **self._accept(cid, label, masks)}

    def _accept(self, cid: str, label: str, masks: list) -> dict:
        if label == OTHER:  # an unknown animal nobody could name: keep it out of the prototypes
            self.store.run("UPDATE clips SET status='rejected', accepted_label=? WHERE id=?", (label, cid))
            self.emit("label_accepted", {"clip_id": cid, "label": label, "learned": False})
            return {"learned": False, "prototype_version": self.head.version}
        mask = next((m for m in masks if m), None)
        x, sr, *_ = self._grids(cid)
        audio = apply_mask(x, sr, self.full_mask(cid, mask)) if mask else x
        with self._infer:
            emb = analyze(self.model, audio, sr, energy_dbfs=self.cfg["gates"]["energy_dbfs"]).clip_embedding()
        with self._learn:
            self.head.add_example(label, emb)
            text = self.head.export_json()
            version = self.head.version
            self.store.save_prototypes(self.model_id, version, text)
        self.store.run("UPDATE clips SET status='solved', accepted_label=? WHERE id=?", (label, cid))
        self.emit("label_accepted", {"clip_id": cid, "label": label, "learned": True, "from_mask": bool(mask)})
        self.emit("prototype_published", {"version": version, "model_id": self.model_id, "classes": self.head.classes})
        return {"learned": True, "prototype_version": version}

    def latest_prototypes(self, model_id: str, device_id: str | None = None, have: int | None = None) -> str | None:
        """Newest prototypes. A device sends its installed version: when that reaches a newer
        version than it reported before, the device has learned it (event `device_updated`)."""
        if device_id and have is not None:
            self.store.touch_device(device_id)
            row = self.store.one("SELECT proto_version FROM devices WHERE id=?", (device_id,))
            if row["proto_version"] is None or have > row["proto_version"]:
                first = row["proto_version"] is None
                self.store.run("UPDATE devices SET proto_version=? WHERE id=?", (have, device_id))
                if not first:
                    self.emit("device_updated", {"device_id": device_id, "version": have})
        row = self.store.latest_prototypes(model_id)
        return row["json"] if row else None

    # ------------------------------------------------------------ gold + stats
    def add_gold(self, wav_path: str, true_label: str) -> str:
        data = open(wav_path, "rb").read()
        info = sf.info(wav_path)
        cid, _ = self.store.add_clip({"duration_s": round(info.duration, 2), "sample_rate": info.samplerate,
                                      "model_id": self.model_id}, data, "gold")
        self.store.run("INSERT OR REPLACE INTO gold_clips (clip_id, true_label) VALUES (?,?)", (cid, true_label))
        return cid

    def stats(self) -> dict:
        st = {r["status"]: r["n"] for r in self.store.q(
            "SELECT status, COUNT(*) n FROM clips WHERE id NOT IN (SELECT clip_id FROM gold_clips) GROUP BY status")}
        return {
            "devices": [dict(r) for r in self.store.q("SELECT * FROM devices WHERE id != 'gold'")],
            "clips": st, "gold_clips": self.store.one("SELECT COUNT(*) n FROM gold_clips")["n"],
            "labels": self.store.one("SELECT COUNT(*) n FROM labels")["n"],
            "players": [dict(r) for r in self.store.q("SELECT id, nickname, reliability, solved FROM players")],
            "prototype_version": self.head.version, "prototype_classes": self.head.classes, "model_id": self.model_id,
            "consensus_needed": 1 if self.b.get("demo_mode") else int(self.b.get("consensus_n", 2)),
            "time": time.time(),
        }
