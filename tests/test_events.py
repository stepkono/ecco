"""Event tracking, repeat counting and the hourly budget (no models needed)."""

from __future__ import annotations

import numpy as np

from core.queue import ClipQueue
from device.events import AudioHistory, EventTracker


def emb(seed: int) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(16).astype(np.float32)


def feed(tr: EventTracker, pattern: str, seg: float = 5.0):
    """h = needs help, q = quiet/recognized, s = speech. Returns closed events."""
    out = []
    for i, c in enumerate(pattern):
        ev = tr.observe(i * seg, (i + 1) * seg, c == "h", embedding=emb(1), level=-30, best_label="frog",
                        best=0.6, similarities={"frog": 0.6}, speech=c == "s")
        if ev:
            out.append(ev)
    return out


def test_gap_is_bridged_and_context_added():
    tr = EventTracker(pre_roll_s=2, post_roll_s=2, gap_tolerance=1, max_event_s=30)
    [ev] = feed(tr, "qhhqhqq")
    assert ev.first_t == 5 and ev.last_t == 25
    assert ev.start_t == 3 and ev.end_t == 27  # 2 s context each side
    assert [(s["start"], s["end"]) for s in ev.timeline] == [(2, 7), (7, 12), (17, 22)]
    assert tr.open is None


def test_two_quiet_segments_split_events():
    tr = EventTracker(gap_tolerance=1)
    assert len(feed(tr, "hqqhqq")) == 2


def test_long_event_is_capped():
    tr = EventTracker(pre_roll_s=2, max_event_s=30)
    evs = feed(tr, "hhhhhhhh")
    assert len(evs) == 1 and evs[0].last_t - evs[0].first_t == 30
    assert evs[0].end_t == evs[0].last_t  # no post-roll: that audio is not recorded yet
    assert tr.open is not None  # the rest continues as a new event


def test_speech_ends_event_without_context():
    tr = EventTracker(post_roll_s=2, gap_tolerance=1)
    [ev] = feed(tr, "hs")
    assert ev.end_t == 5  # nothing from the speech segment
    tr2 = EventTracker(gap_tolerance=1)
    evs = feed(tr2, "hshq")
    assert len(evs) == 1 and tr2.open is not None  # speech never sits inside an event


def test_history_slices_by_audio_time():
    h = AudioHistory(10, seconds=3)
    h.push(np.arange(20, dtype=np.float32))  # 2 s
    h.push(np.arange(20, 40, dtype=np.float32))  # 4 s total, keeps the last 3 s
    x, t0, t1 = h.slice(0.0, 2.5)
    assert t0 == 1.0 and t1 == 2.5 and x[0] == 10 and len(x) == 15


def test_repeat_counts_and_keeps_clearer_recording(tmp_path):
    q = ClipQueue(tmp_path)
    cid = q.enqueue(np.zeros(800, np.float32), 16000, emb(1), device_id="d", model_id="m", best_guess="x",
                    best_score=0.5, novelty=0.5, quality=-40)
    twin, sim = q.most_similar(emb(1) + 0.01, since=0)
    assert twin.id == cid and sim > 0.99
    assert q.record_repeat(cid, audio=np.ones(1600, np.float32) * 0.1, sr=16000, embedding=emb(1), quality=-20,
                           novelty=0.5, timeline=[{"start": 0, "end": 1}]) is True
    c = q.get(cid)
    assert c.heard_count == 2 and c.quality == -20 and c.duration_s == 0.1
    assert q.record_repeat(cid, audio=np.zeros(800, np.float32), sr=16000, embedding=emb(1), quality=-50) is False
    assert q.get(cid).heard_count == 3 and q.get(cid).quality == -20


def test_queue_migrates_old_database(tmp_path):
    import sqlite3

    db = sqlite3.connect(tmp_path / "queue.db")
    db.execute("CREATE TABLE clips (id TEXT PRIMARY KEY, created_at REAL NOT NULL, device_id TEXT NOT NULL, "
               "model_id TEXT NOT NULL, wav_path TEXT NOT NULL, sample_rate INTEGER NOT NULL, embedding BLOB NOT NULL, "
               "best_guess TEXT, best_score REAL, scores_json TEXT, uploaded INTEGER NOT NULL DEFAULT 0)")
    db.execute("INSERT INTO clips VALUES ('old', 1.0, 'd', 'm', '/x.wav', 16000, ?, NULL, NULL, '{}', 0)",
               (emb(2).tobytes(),))
    db.commit()
    db.close()
    c = ClipQueue(tmp_path).get("old")
    assert c.heard_count == 1 and c.timeline == [] and c.duration_s is None


def test_least_novel_pending_for_budget(tmp_path):
    q = ClipQueue(tmp_path)
    for i, nov in enumerate([0.4, 0.1, 0.7]):
        q.enqueue(np.zeros(10, np.float32), 16000, emb(i), device_id="d", model_id="m", best_guess=None,
                  best_score=None, novelty=nov)
    assert q.count_since(0) == 3
    assert q.least_novel_pending_since(0).novelty == 0.1
