"""Signal Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from signal_service.lifecycle import SignalLifecycle


@dataclass(frozen=True, slots=True)
class SignalStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: SignalLifecycle
    since: str
