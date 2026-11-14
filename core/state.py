"""Device states and a small state machine with a hold time against flicker."""

from __future__ import annotations

import time
from dataclasses import dataclass
from enum import Enum

from .heads import Decision


class StateKind(str, Enum):
    QUIET = "quiet"
    RECOGNIZED = "recognized"
    NEEDS_HELP = "needs_help"


@dataclass(frozen=True)
class State:
    kind: StateKind
    label: str | None = None
    score: float = 0.0

    @property
    def color(self) -> str:
        return {StateKind.QUIET: "#8a8f98", StateKind.RECOGNIZED: "#2bb673", StateKind.NEEDS_HELP: "#f5a623"}[self.kind]

    def describe(self) -> str:
        if self.kind == StateKind.RECOGNIZED:
            return f"Recognized: {self.label} ({self.score:.2f})"
        if self.kind == StateKind.NEEDS_HELP:
            return f"Needs help (best {self.score:.2f})"
        return "Quiet"


QUIET = State(StateKind.QUIET)


def state_for(energy_ok: bool, speech: bool, decision: Decision | None, noise_label: str = "noise") -> State:
    """Map gate results and a head decision to a device state.

    * silence or speech: QUIET (speech clips are dropped, never shown as needing help)
    * a recognized noise class (rain, wind): QUIET, which is how false alarms get fixed
    * recognized animal: RECOGNIZED
    * real sound the head does not know: NEEDS_HELP
    """
    if not energy_ok or speech or decision is None:
        return QUIET
    if decision.recognized:
        if decision.label == noise_label:
            return QUIET
        return State(StateKind.RECOGNIZED, decision.label, decision.best)
    return State(StateKind.NEEDS_HELP, decision.best_label, decision.best)


class StateMachine:
    """Shows a non-quiet state for at least `hold_seconds`, so the light does not flicker."""

    def __init__(self, hold_seconds: float = 2.0) -> None:
        self.hold = hold_seconds
        self.current = QUIET
        self._since = 0.0

    def update(self, new: State, now: float | None = None) -> State:
        now = time.monotonic() if now is None else now
        if new == self.current:
            return self.current
        held = now - self._since
        if self.current.kind != StateKind.QUIET and new.kind == StateKind.QUIET and held < self.hold:
            return self.current
        self.current = new
        self._since = now
        return self.current
