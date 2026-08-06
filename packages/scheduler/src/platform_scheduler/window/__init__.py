"""Execution Window — the canonical execution window (supplied boundaries; no wall-clock/timers)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ExecutionWindow:
    """An immutable execution window with supplied ISO-8601 boundaries (no wall-clock read, CS-3)."""

    opens_at: str
    closes_at: str
    timezone: str
