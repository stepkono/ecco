"""The listening post: audio -> gates -> embedding -> head -> state -> light, queue and sync.

One decision per `decision_hop_s` on the latest `clip_seconds` of audio:

1. energy gate        silent clip -> QUIET
2. privacy gate       speech -> QUIET, the clip is dropped and never queued
3. embedding + head   recognized animal -> RECOGNIZED, recognized noise -> QUIET
4. otherwise          NEEDS_HELP, and the 5 s clip goes into the queue for players

The trust knob sets T_known live. New prototypes swap in without a restart.
"""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import threading
import time
from collections import deque
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

log = logging.getLogger("biospectra.device")


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
    queued: str | None
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
        self.cooldown_s = float(dev.get("queue_cooldown_s", 10))
        self.margin = float(cfg["head"]["margin"])
        self.noise_label = cfg["head"]["noise_label"]
        self.t_noise = float(cfg["head"].get("t_noise", 1.0))
        self.knob_lo, self.knob_hi = cfg["head"].get("knob_range", [0.4, 0.95])
        self.t_known = float(cfg["head"].get("t_known_by_model", {}).get(self.model.model_id, cfg["head"]["t_known"]))
        self._lock = threading.Lock()
        self.head = PrototypeHead(self.model.model_id, self.model.model_version, self.model.embedding_dim)
        path = prototype_path(self.model.model_id)
        if path.exists():
            self.swap_prototypes(path.read_text(encoding="utf-8"), f"file {path.name}")
        self._last_queued = -1e9  # in audio seconds, so the cooldown works at any playback speed
        self._audio_t = 0.0
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
    def step(self, clip: np.ndarray, sr: int, source_label: str = "") -> DecisionEvent:
        t0 = time.perf_counter()
        self._apply_knob()
        a = analyze(self.model, clip, sr, energy_dbfs=self.cfg["gates"]["energy_dbfs"])
        energy_ok = bool(a.energy_ok.any())
        if self.shared_privacy and a.scores is not None:
            pr = self.privacy.check_scores(a.scores)
        else:
            pr = self.privacy.check(clip, sr)
        with self._lock:
            head = self.head
        decision = None
        emb = a.clip_embedding()
        if energy_ok and not pr.speech:
            decision = head.predict(emb, self.t_known, self.margin)
            if (not decision.recognized and is_noise(decision.best_label, self.noise_label)
                    and decision.best >= self.t_noise and decision.margin >= self.margin):
                decision.label = decision.best_label  # clearly weather: stay quiet
        raw = state_for(energy_ok, pr.speech, decision, self.noise_label)
        shown = self.sm.update(raw)
        queued = None
        self._audio_t += self.hop_s
        now = self._audio_t
        if raw.kind == StateKind.NEEDS_HELP and now - self._last_queued >= self.cooldown_s:
            sims = decision.similarities if decision else {}
            queued = self.queue.enqueue(
                clip, sr, emb, device_id=self.cfg["device"]["id"], model_id=self.model.model_id,
                best_guess=decision.best_label if decision else None,
                best_score=round(decision.best, 4) if decision else None,
                scores={k: round(v, 4) for k, v in sims.items()},
            )
            self._last_queued = now
        ev = DecisionEvent(
            time=time.strftime("%H:%M:%S"), source=source_label, raw_state=raw.kind.value, shown_state=shown.kind.value,
            label=raw.label, best_label=decision.best_label if decision else None,
            score=round(decision.best, 3) if decision else 0.0, margin=round(decision.margin, 3) if decision else 0.0,
            speech=pr.speech, speech_score=round(pr.score, 3), level_dbfs=round(rms_dbfs(clip), 1),
            t_known=self.t_known, proto_version=head.version, queued=queued,
            latency_ms=round(1000 * (time.perf_counter() - t0), 1), peak_rss_mb=round(peak_rss_mb(), 0),
        )
        self._publish(ev, shown)
        return ev

    def _publish(self, ev: DecisionEvent, shown) -> None:
        self.events.append(ev)
        with open(self.events_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(ev)) + "\n")
        why = "speech, dropped" if ev.speech else (
            f"{ev.best_label} {ev.score:.2f} (margin {ev.margin:.2f})" if ev.best_label else f"{ev.level_dbfs:.0f} dBFS")
        text = f"{ev.raw_state.upper():10s} {why}" + (f" → queued {ev.queued}" if ev.queued else "")
        log.info("%s [%s] %s · %.0f ms · %.0f MB", ev.time, ev.source, text, ev.latency_ms, ev.peak_rss_mb)
        with self._lock:
            classes = len(self.head.classes)
        self.hw.show_state(shown, {
            "event": f"{ev.source}: {text}", "time": ev.time, "detail": why, "t_known": ev.t_known,
            "proto_version": ev.proto_version, "proto_classes": classes, "queue": self.queue.count(only_pending=True),
            "sync": self.sync_status(), "latency_ms": ev.latency_ms, "device": self.cfg["device"]["id"],
            "location": self.cfg["device"]["location"], "model_id": self.model.model_id,
        })

    # ------------------------------------------------------------ main loop
    def run(self, max_decisions: int | None = None) -> list[DecisionEvent]:
        """Read `hop` seconds at a time, decide on the latest `clip` seconds. Returns the events."""
        sr = self.source.sample_rate
        need = int(self.clip_s * sr)
        buf = np.zeros(0, dtype=np.float32)
        out: list[DecisionEvent] = []
        while max_decisions is None or len(out) < max_decisions:
            chunk = self.source.read(self.hop_s)
            if chunk is None:
                break
            buf = np.concatenate([buf, chunk])[-need:]
            if len(buf) < need:
                continue
            out.append(self.step(buf, sr, getattr(self.source, "label", "")))
        return out
