"""Schedule Registry — the Schedule model and register-before-use SchedulerRegistry (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_scheduler.core import ScheduleIdentifier
from platform_scheduler.retry import RetryPolicy
from platform_scheduler.trigger import Trigger
from platform_scheduler.window import ExecutionWindow


@dataclass(frozen=True, slots=True)
class Schedule:
    """An immutable, versioned schedule binding a job to a trigger, optional window, and retry policy."""

    identifier: ScheduleIdentifier
    job_ref: Id
    trigger: Trigger
    window: ExecutionWindow | None
    retry_policy: RetryPolicy


class SchedulerRegistry(Protocol):
    """Register-before-use registry of schedules. Interface only — no persistence.

    Schedules are append-only and versioned; a change creates a new version.
    """

    def register(self, schedule: Schedule) -> None: ...
    def get(self, schedule: Id) -> Schedule: ...
