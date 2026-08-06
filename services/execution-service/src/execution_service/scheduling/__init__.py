"""Execution Scheduling — the schedule model and scheduling INTERFACE (deterministic; no infra)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ExecutionSchedule:
    """An immutable execution window (supplied ISO-8601 boundaries; no wall-clock read, CS-3)."""

    window_start: str
    window_end: str


class ExecutionSchedulingService(Protocol):
    """Schedules/reschedules an authorized execution plan deterministically. Interface only — no infra.

    Rescheduling within the authorization does not itself execute; live remains token-gated (RS-4).
    """

    def schedule(self, execution: EntityId, schedule: ExecutionSchedule) -> None: ...
    def reschedule(self, execution: EntityId, schedule: ExecutionSchedule) -> None: ...
