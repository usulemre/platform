"""Job Monitoring — the job run-status model and monitor INTERFACE (narrate only; no infra)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class JobHealth(Enum):
    HEALTHY = "healthy"
    DELAYED = "delayed"
    STUCK = "stuck"
    FAILED = "failed"
    UNKNOWN = "unknown"


@dataclass(frozen=True, slots=True)
class JobRunStatus:
    """An immutable job run status (``observed_at`` is a supplied ISO-8601 time, CS-3)."""

    job: Id
    health: JobHealth
    observed_at: str


class JobMonitor(Protocol):
    """Surfaces job run status/health for monitoring. Interface only — narrates; decides no halt.

    The concrete monitor plugs in behind this interface; no infrastructure here.
    """

    def status(self, job: Id) -> JobRunStatus: ...
