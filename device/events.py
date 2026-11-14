"""Turn per-segment "needs help" decisions into sound events with context.

Instead of one detached 5 s snippet per uncertain decision, consecutive uncertain
segments are merged into one event. A short gap (a quiet or recognized segment in
between) does not split it. The saved audio starts `pre_roll_s` before the first
uncertain segment and ends `post_roll_s` after the last one, capped at
`max_event_s`. The audio comes from a rolling history buffer.

Privacy: a speech segment ends an open event at once and adds no context after
it. The listener also keeps the context before an event out of earlier speech.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from core.heads import l2norm


class AudioHistory:
    """The last `seconds` of audio, addressable by absolute audio time."""

    def __init__(self, sr: int, seconds: float) -> None:
        self.sr = sr
        self.keep = int(seconds * sr)
        self.buf = np.zeros(0, dtype=np.float32)
        self.end_t = 0.0  # audio time (s) of the last sample

    def push(self, chunk: np.ndarray) -> None:
        self.buf = np.concatenate([self.buf, chunk])[-self.keep:]
        self.end_t += len(chunk) / self.sr

    @property
    def start_t(self) -> float:
        return self.end_t - len(self.buf) / self.sr

    def slice(self, t0: float, t1: float) -> tuple[np.ndarray, float, float]:
        """Audio between t0 and t1, clamped to what is still in memory. Returns (audio, t0, t1)."""
        t0 = max(t0, self.start_t)
        t1 = min(t1, self.end_t)
        i0 = int(round((t0 - self.start_t) * self.sr))
        i1 = int(round((t1 - self.start_t) * self.sr))
        return self.buf[i0:i1].copy(), t0, t1


@dataclass
class OpenEvent:
    start_t: float  # start of the first uncertain segment (audio time)
    end_t: float  # end of the last uncertain segment
    segments: list = field(default_factory=list)
    embeddings: list = field(default_factory=list)
    levels: list = field(default_factory=list)
    best: list = field(default_factory=list)
    gap: int = 0


@dataclass
class ClosedEvent:
    start_t: float  # including pre-roll
    end_t: float  # including post-roll
    first_t: float  # first uncertain segment
    last_t: float  # end of the last uncertain segment
    embedding: np.ndarray
    novelty: float  # 1 - mean best similarity: higher = less like anything known
    quality: float  # mean level (dBFS) of the uncertain segments: louder = clearer
    best_guess: str | None
    best_score: float | None
    scores: dict
    timeline: list  # uncertain segments, times relative to the saved audio
    segment_embeddings: np.ndarray  # (segments, d): used to tell a true repeat from a new sound


class EventTracker:
    def __init__(self, pre_roll_s: float = 2.0, post_roll_s: float = 2.0, gap_tolerance: int = 1,
                 max_event_s: float = 30.0) -> None:
        self.pre = pre_roll_s
        self.post = post_roll_s
        self.gap_tolerance = gap_tolerance
        self.max_s = max_event_s
        self.open: OpenEvent | None = None

    def observe(self, seg_start: float, seg_end: float, needs_help: bool, *, embedding=None, level: float = 0.0,
                best_label: str | None = None, best: float = 0.0, similarities: dict | None = None,
                speech: bool = False) -> ClosedEvent | None:
        """Feed one decision. Returns an event when one is finished."""
        closed = None
        if speech:
            # never let speech into an event: close now, without post-roll
            return self._close(post_roll=0.0, end_before=seg_start) if self.open else None
        if needs_help:
            if self.open is None:
                self.open = OpenEvent(seg_start, seg_end)
            ev = self.open
            ev.end_t = seg_end
            ev.gap = 0
            ev.segments.append({"start": seg_start, "end": seg_end, "best_guess": best_label, "best": round(best, 3),
                                "similarities": {k: round(v, 3) for k, v in sorted(
                                    (similarities or {}).items(), key=lambda kv: -kv[1])[:5]}})
            ev.embeddings.append(np.asarray(embedding, np.float32))
            ev.levels.append(level)
            ev.best.append(best)
            if ev.end_t - ev.start_t >= self.max_s:
                closed = self._close(post_roll=0.0)  # audio after this moment is not recorded yet
        elif self.open is not None:
            self.open.gap += 1
            if self.open.gap > self.gap_tolerance:
                closed = self._close(post_roll=self.post)
        return closed

    def flush(self) -> ClosedEvent | None:
        return self._close(post_roll=self.post) if self.open else None

    def _close(self, post_roll: float, end_before: float | None = None) -> ClosedEvent:
        ev = self.open
        self.open = None
        start = ev.start_t - self.pre
        end = ev.end_t + post_roll
        if end_before is not None:
            end = min(end, max(ev.end_t, end_before))
        emb = l2norm(np.mean([l2norm(e) for e in ev.embeddings], axis=0))
        # the segment the head was most sure about names the event
        i = int(np.argmax(ev.best))
        seg = ev.segments[i]
        timeline = [{**s, "start": round(s["start"] - start, 2), "end": round(s["end"] - start, 2)} for s in ev.segments]
        return ClosedEvent(
            start_t=start, end_t=end, first_t=ev.start_t, last_t=ev.end_t, embedding=emb,
            novelty=round(1.0 - float(np.mean(ev.best)), 3), quality=round(float(np.mean(ev.levels)), 1),
            best_guess=seg["best_guess"], best_score=seg["best"], scores=seg["similarities"], timeline=timeline,
            segment_embeddings=np.stack([l2norm(e) for e in ev.embeddings]).astype(np.float32),
        )
