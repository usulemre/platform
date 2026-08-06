"""Job Lifecycle — the canonical job lifecycle states, transitions, status, and lifecycle service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class JobLifecycle(Enum):
    """The canonical job lifecycle (plus PAUSED and CANCELLED)."""

    REGISTERED = "registered"
    SCHEDULED = "scheduled"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    ARCHIVED = "archived"
    PAUSED = "paused"
    CANCELLED = "cancelled"


L = JobLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[JobLifecycle, JobLifecycle], ...] = (
    (L.REGISTERED, L.SCHEDULED),
    (L.SCHEDULED, L.READY),
    (L.READY, L.RUNNING),
    (L.RUNNING, L.COMPLETED),
    (L.COMPLETED, L.ARCHIVED),
    # failure / retry
    (L.RUNNING, L.FAILED),
    (L.FAILED, L.RETRYING),
    (L.RETRYING, L.READY),
    (L.FAILED, L.ARCHIVED),
    # recovery
    (L.FAILED, L.READY),
    # pause / resume
    (L.SCHEDULED, L.PAUSED),
    (L.READY, L.PAUSED),
    (L.PAUSED, L.SCHEDULED),
    # cancellation
    (L.SCHEDULED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.RUNNING, L.CANCELLED),
    (L.PAUSED, L.CANCELLED),
    (L.CANCELLED, L.ARCHIVED),
)

#: Terminal state. Replay re-runs a job as a NEW scheduled run (with lineage), never a mutation.
TERMINAL_STATES: frozenset[JobLifecycle] = frozenset({L.ARCHIVED})


@dataclass(frozen=True, slots=True)
class JobStatus:
    """The current lifecycle status of a job (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: JobLifecycle
    since: str


class JobLifecycleService(Protocol):
    """Governs job lifecycle transitions and supported operations. Interface only.

    Supports pause, resume, cancellation, retry, and recovery; no infrastructure or timers here.
    """

    def transition(self, job: Id, to: JobLifecycle) -> None: ...
    def pause(self, job: Id) -> None: ...
    def resume(self, job: Id) -> None: ...
    def cancel(self, job: Id) -> None: ...
    def retry(self, job: Id) -> None: ...
    def recover(self, job: Id) -> None: ...
