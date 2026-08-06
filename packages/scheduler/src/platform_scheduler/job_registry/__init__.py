"""Job Registry — the register-before-schedule registry of jobs (no persistence)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from platform_scheduler.core import ScheduledJob


class JobRegistry(Protocol):
    """Register-before-schedule registry of jobs. Interface only — no persistence.

    A job must be registered before it can be scheduled; registration is append-only.
    """

    def register(self, job: ScheduledJob) -> None: ...
    def get(self, job: Id) -> ScheduledJob: ...
    def is_registered(self, job: Id) -> bool: ...
