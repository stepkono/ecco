"""The listening post: audio -> gates -> embedding -> head -> state -> light, queue and sync.

One decision per `decision_hop_s` on the latest `clip_seconds` of audio:

1. energy gate        silent clip -> QUIET
2. privacy gate       speech -> QUIET, the clip is dropped and never queued
3. embedding + head   recognized animal -> RECOGNIZED, recognized noise -> QUIET
4. otherwise          NEEDS_HELP

Uncertain segments are merged into sound events with a little context before and
after (device/events.py). A finished event is queued for players, unless the same
sound is already queued (then it is only counted) or the hourly budget is used up
(then only a more novel event may replace the least novel one). Recognized sounds
are counted, not sent.

The trust knob sets T_known live. New prototypes swap in without a restart.
"""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import threading
import time
from collections import Counter, deque
from dataclasses import asdict, dataclass

import numpy as np

from core.audio import rms_dbfs
from core.config import data_path
from core.gates import PrivacyGate
from core.heads import PrototypeHead, PrototypeMismatch
from core.measure import peak_rss_mb
from core.models.base import ModelRegistry
from core.pipeline import analyze
from core.queue import ClipQueue
from core.state import StateKind, StateMachine, is_noise, state_for

from .events import AudioHistory, ClosedEvent, EventTracker

log = logging.getLogger("biospectra.device")


@dataclass
class Verdict:
    """Everything the device concluded about one clip, without side effects."""

    analysis: object  # core.pipeline.ClipAnalysis
    privacy: object  # core.gates.PrivacyResult
    decision: object | None  # core.heads.Decision
    raw: object  # core.state.State
    energy_ok: bool
    embedding: np.ndarray
    proto_version: int
    latency_ms: float


@dataclass
class DecisionEvent:
    time: str
    source: str
    raw_state: str
    shown_state: str
    label: str | None
    best_label: str | None
    score: float
    margin: float
    speech: bool
    speech_score: float
    level_dbfs: float
    t_known: float
    proto_version: int
    queued: str | None  # id of the event saved or updated at this decision
    event: str | None  # what happened to a finished event: saved, repeat, replaced, dropped
    latency_ms: float
    peak_rss_mb: float


def prototype_path(model_id: str):
    return data_path("prototypes") / f"{model_id}.prototype.json"


def set_mic_gain(audio_cfg: dict) -> None:
    """Lower the capture gain (the USB camera mic clips at 100 %). Silent no-op without amixer."""
    pct = audio_cfg.get("mic_gain_percent")
    if pct is None or not shutil.which("amixer"):
        return
    cmd = ["amixer", "-q", "-c", str(audio_cfg.get("mixer_card", "0")), "sset",
           str(audio_cfg.get("mixer_control", "Mic")), f"{int(pct)}%"]
    r = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if r.returncode == 0:
        log.info("mic gain set to %s%% (%s)", pct, " ".join(cmd[3:]))
    else:
        log.warning("could not set mic gain: %s", r.stderr.strip())


class Listener:
    def __init__(self, cfg: dict, registry: ModelRegistry, source, hardware) -> None:
        dev = cfg["device"]
        self.cfg = cfg
        self.source = source
        self.hw = hardware
        self.model = registry.get(dev["model_id"])
        pid = dev.get("privacy_model_id") or cfg["gates"]["privacy"]["model_id"]
        self.privacy = PrivacyGate.from_config(registry.get(pid), cfg["gates"]["privacy"])
        self.shared_privacy = pid == self.model.model_id
        self.queue = ClipQueue(data_path("queue"))
        self.sm = StateMachine(cfg["state"]["hold_seconds"])
        self.clip_s = float(cfg["runtime"]["clip_seconds"])
        self.hop_s = float(dev.get("decision_hop_s", self.clip_s))
        self.margin = float(cfg["head"]["margin"])
        self.noise_label = cfg["head"]["noise_label"]
        self.t_noise = float(cfg["head"].get("t_noise", 1.0))
        self.knob_lo, self.knob_hi = cfg["head"].get("knob_range", [0.4, 0.95])
        self.t_known = float(cfg["head"].get("t_known_by_model", {}).get(self.model.model_id, cfg["head"]["t_known"]))
        self._lock = threading.Lock()
        self.infer_lock = threading.Lock()  # LiteRT interpreters are not thread-safe: one inference at a time
        self.head = PrototypeHead(self.model.model_id, self.model.model_version, self.model.embedding_dim)
        path = prototype_path(self.model.model_id)
        if path.exists():
            self.swap_prototypes(path.read_text(encoding="utf-8"), f"file {path.name}")
        ev_cfg = cfg.get("events", {})
        self.ev_cfg = ev_cfg
        self.tracker = EventTracker(ev_cfg.get("pre_roll_s", 2.0), ev_cfg.get("post_roll_s", 2.0),
                                    int(ev_cfg.get("gap_tolerance", 1)), ev_cfg.get("max_event_s", 30.0))
        self.history: AudioHistory | None = None
        self.stats = Counter()  # events_saved, repeats, replaced_better, budget_replaced, budget_dropped
        self.detections = Counter()  # recognized label -> count since start
        self.recent_detections: deque[tuple[float, str]] = deque(maxlen=20000)
        self._last_speech_end = -1e9  # audio time: event context must not reach back into speech
        # off by default and after every restart: speech is dropped on the board (privacy)
        self.keep_speech = False
        self.events: deque[DecisionEvent] = deque(maxlen=200)
        self.events_file = data_path("data") / "device_events.jsonl"
        self.sync_status = lambda: "offline"
        log.info("listener ready: model %s (%d-d), privacy %s%s, T_known %.2f, clip %.1f s, hop %.1f s",
                 self.model.model_id, self.model.embedding_dim, pid, " (shared inference)" if self.shared_privacy else "",
                 self.t_known, self.clip_s, self.hop_s)

    # ------------------------------------------------------------ knob + prototypes
    def knob_value(self) -> float:
        return (self.t_known - self.knob_lo) / (self.knob_hi - self.knob_lo)

    def _apply_knob(self) -> None:
        v = self.hw.read_knob()
        if v is not None:
            self.t_known = round(self.knob_lo + v * (self.knob_hi - self.knob_lo), 3)

    @property
    def proto_version(self) -> int:
        return self.head.version

    def swap_prototypes(self, text: str, origin: str) -> bool:
        """Replace the head while running. Rejects files for another model or embedding size."""
        new = PrototypeHead(self.model.model_id, self.model.model_version, self.model.embedding_dim)
        try:
            new.import_json(text)
        except (PrototypeMismatch, ValueError, KeyError) as e:
            log.warning("prototypes from %s rejected: %s", origin, e)
            return False
        with self._lock:
            old = self.head.version
            self.head = new
        log.info("prototypes v%d -> v%d from %s: %s", old, new.version, origin,
                 ", ".join(f"{k}×{v}" for k, v in new.classes.items()))
        self.hw.beep("learned")
        return True

    # ------------------------------------------------------------ one decision
    def evaluate(self, clip: np.ndarray, sr: int) -> Verdict:
        """Gates, embedding and head for one clip. No queue, no light, no log: safe for ad-hoc analysis."""
        t0 = time.perf_counter()
        with self.infer_lock:
            a = analyze(self.model, clip, sr, energy_dbfs=self.cfg["gates"]["energy_dbfs"])
            if self.shared_privacy and a.scores is not None:
                pr = self.privacy.check_scores(a.scores)
            else:
                pr = self.privacy.check(clip, sr)
        energy_ok = bool(a.energy_ok.any())
        with self._lock:
            head = self.head
        decision = None
        emb = a.clip_embedding()
        speech = pr.speech and not self.keep_speech  # the switch in the console turns the filter off
        if energy_ok and not speech:
            decision = head.predict(emb, self.t_known, self.margin)
            if (not decision.recognized and is_noise(decision.best_label, self.noise_label)
                    and decision.best >= self.t_noise and decision.margin >= self.margin):
                decision.label = decision.best_label  # clearly weather: stay quiet
        raw = state_for(energy_ok, speech, decision, self.noise_label)
        return Verdict(a, pr, decision, raw, energy_ok, emb, head.version, round(1000 * (time.perf_counter() - t0), 1))

    def step(self, clip: np.ndarray, sr: int, source_label: str = "") -> DecisionEvent:
        """One decision on the latest clip. Call `run` for the loop (it keeps the audio history)."""
        self._apply_knob()
        if self.history is None or self.history.sr != sr:
            self.history = AudioHistory(sr, self._history_seconds())
            self.history.push(clip)
        v = self.evaluate(clip, sr)
        pr, decision, raw = v.privacy, v.decision, v.raw
        speech = pr.speech and not self.keep_speech
        shown = self.sm.update(raw)
        if raw.kind == StateKind.RECOGNIZED and raw.label:
            self.detections[raw.label] += 1
            self.recent_detections.append((time.time(), raw.label))
        seg_end = self.history.end_t
        closed = self.tracker.observe(
            seg_end - self.clip_s, seg_end, raw.kind == StateKind.NEEDS_HELP, embedding=v.embedding,
            level=rms_dbfs(clip), best_label=decision.best_label if decision else None,
            best=decision.best if decision else 0.0, similarities=decision.similarities if decision else None,
            speech=speech, source=source_label,
        )
        queued, action = self._commit(closed, sr) if closed else (None, None)
        if speech:  # after committing: this segment only limits the context of later events
            self._last_speech_end = seg_end
        ev = DecisionEvent(
            time=time.strftime("%H:%M:%S"), source=source_label, raw_state=raw.kind.value, shown_state=shown.kind.value,
            label=raw.label, best_label=decision.best_label if decision else None,
            score=round(decision.best, 3) if decision else 0.0, margin=round(decision.margin, 3) if decision else 0.0,
            speech=speech, speech_score=round(pr.score, 3), level_dbfs=round(rms_dbfs(clip), 1),
            t_known=self.t_known, proto_version=v.proto_version, queued=queued, event=action,
            latency_ms=v.latency_ms, peak_rss_mb=round(peak_rss_mb(), 0),
        )
        self._publish(ev, shown)
        return ev

    def _history_seconds(self) -> float:
        c = self.ev_cfg
        return c.get("max_event_s", 30.0) + c.get("pre_roll_s", 2.0) + c.get("post_roll_s", 2.0) + self.clip_s + 2 * self.hop_s

    def _commit(self, ev: ClosedEvent, sr: int) -> tuple[str | None, str]:
        """Queue a finished event, count it as a repeat, or drop it when the hourly budget is used up."""
        start = min(max(ev.start_t, self._last_speech_end), ev.first_t)  # no speech in the pre-roll
        audio, t0, t1 = self.history.slice(start, ev.end_t)
        shift = t0 - ev.start_t  # pre-roll may be shorter right after start
        timeline = [{**s, "start": round(s["start"] - shift, 2), "end": round(s["end"] - shift, 2)} for s in ev.timeline]
        fields = dict(embedding=ev.embedding, best_guess=ev.best_guess, best_score=ev.best_score, scores=ev.scores,
                      novelty=ev.novelty, quality=ev.quality, timeline=timeline,
                      segment_embeddings=ev.segment_embeddings)
        now = time.time()
        window = float(self.ev_cfg.get("dedup_window_h", 24)) * 3600
        twin, cov, sim = self.queue.find_repeat(ev.segment_embeddings, now - window,
                                                float(self.ev_cfg.get("dedup_similarity", 0.85)))
        if twin is not None and cov >= float(self.ev_cfg.get("dedup_coverage", 0.8)):
            replaced = self.queue.record_repeat(twin.id, audio=audio, sr=sr, **fields)
            self.stats["repeats"] += 1
            self.stats["replaced_better"] += int(replaced)
            note = ", kept the clearer recording" if replaced else ""
            return twin.id, (f"repeat of {twin.id} ({cov:.0%} of segments match, similarity {sim:.2f}, "
                             f"heard {twin.heard_count + 1}×{note})")
        budget = int(self.ev_cfg.get("budget_per_hour", 20))
        if self.queue.count_since(now - 3600) >= budget:
            weakest = self.queue.least_novel_pending_since(now - 3600)
            if weakest is None or (weakest.novelty or 0.0) >= ev.novelty:
                self.stats["budget_dropped"] += 1
                return None, f"dropped: {budget} events this hour already, none less novel"
            self.queue.delete(weakest.id)
            self.stats["budget_replaced"] += 1
            prefix = f"replaced less novel {weakest.id}, "
        else:
            prefix = ""
        cid = self.queue.enqueue(audio, sr, ev.embedding, device_id=self.cfg["device"]["id"], model_id=self.model.model_id,
                                 best_guess=ev.best_guess, best_score=ev.best_score, scores=ev.scores,
                                 novelty=ev.novelty, quality=ev.quality, timeline=timeline)
        self.stats["events_saved"] += 1
        return cid, f"{prefix}saved event {cid} ({t1 - t0:.0f} s, {len(timeline)} unclear segments)"

    def flush(self) -> tuple[str | None, str | None]:
        """Close an event that is still open (end of a file, or Stop)."""
        closed = self.tracker.flush()
        if closed is None or self.history is None:
            return None, None
        cid, action = self._commit(closed, self.history.sr)
        log.info("end of input: %s", action)
        return cid, action

    def reset_learning_state(self) -> None:
        """Demo only: forget queued events, open events, counters and the light's hold."""
        for c in self.queue.all(limit=100000):
            self.queue.delete(c.id)
        self.tracker.open = None
        self.stats.clear()
        self.detections.clear()
        self.recent_detections.clear()
        self.sm = StateMachine(self.cfg["state"]["hold_seconds"])
        self._last_speech_end = -1e9

    def detection_counts(self, last_s: float = 3600) -> dict:
        since = time.time() - last_s
        return dict(Counter(lbl for t, lbl in self.recent_detections if t >= since))

    def _publish(self, ev: DecisionEvent, shown) -> None:
        self.events.append(ev)
        with open(self.events_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(ev)) + "\n")
        why = "speech, dropped" if ev.speech else (
            f"{ev.best_label} {ev.score:.2f} (margin {ev.margin:.2f})" if ev.best_label else f"{ev.level_dbfs:.0f} dBFS")
        text = f"{ev.raw_state.upper():10s} {why}" + (f" → {ev.event}" if ev.event else "")
        log.info("%s [%s] %s · %.0f ms · %.0f MB", ev.time, ev.source, text, ev.latency_ms, ev.peak_rss_mb)
        with self._lock:
            classes = len(self.head.classes)
        self.hw.show_state(shown, {
            "event": f"{ev.source}: {text}", "time": ev.time, "detail": why, "t_known": ev.t_known,
            "proto_version": ev.proto_version, "proto_classes": classes, "queue": self.queue.count(only_pending=True),
            "sync": self.sync_status(), "latency_ms": ev.latency_ms, "device": self.cfg["device"]["id"],
            "location": self.cfg["device"]["location"], "model_id": self.model.model_id,
            "event_action": ev.event, "source": ev.source, "raw_state": ev.raw_state, "label": ev.label,
            "score": ev.score, "proto_version": ev.proto_version,
        })

    # ------------------------------------------------------------ main loop
    def run(self, max_decisions: int | None = None, stop: threading.Event | None = None,
            source=None) -> list[DecisionEvent]:
        """Read `hop` seconds at a time, decide on the latest `clip` seconds. Returns the events.

        `stop` ends the loop from another thread (the console's Stop button). `source`
        overrides the source given at construction.
        """
        src = source or self.source
        sr = src.sample_rate
        need = int(self.clip_s * sr)
        self.history = AudioHistory(sr, self._history_seconds())
        self.tracker.open = None
        buf = np.zeros(0, dtype=np.float32)
        out: list[DecisionEvent] = []
        try:
            while (max_decisions is None or len(out) < max_decisions) and not (stop and stop.is_set()):
                chunk = src.read(self.hop_s)
                if chunk is None or (stop and stop.is_set()):
                    break
                self.history.push(chunk)
                buf = np.concatenate([buf, chunk])[-need:]
                if len(buf) < need:
                    continue
                out.append(self.step(buf, sr, getattr(src, "label", "")))
        finally:
            self.flush()  # never lose an open event
        return out
