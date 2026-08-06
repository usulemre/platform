"""Error Model — the canonical, vendor-neutral Scheduler error model (no infrastructure details)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SchedulerErrorKind(Enum):
    UNREGISTERED_JOB = "unregistered_job"              # register-before-schedule
    DEPENDENCY_UNSATISFIED = "dependency_unsatisfied"  # dependency-aware scheduling
    CYCLIC_DEPENDENCY = "cyclic_dependency"            # a dependency cycle (must be acyclic)
    WINDOW_CLOSED = "window_closed"                    # the execution window is closed
    MAX_RETRIES_EXCEEDED = "max_retries_exceeded"      # retry policy exhausted
    ILLEGAL_TRANSITION = "illegal_transition"          # lifecycle transition not allowed (fail-closed)
    NON_DETERMINISTIC = "non_deterministic"            # a non-deterministic scheduling attempt (DE-1)


@dataclass(frozen=True, slots=True)
class SchedulerError:
    """A canonical, vendor-neutral scheduler error (no infrastructure/vendor details leaked)."""

    kind: SchedulerErrorKind
    message: str


class SchedulerFrameworkError(Exception):
    """Base exception for the Scheduler Framework (framework faults, not infrastructure errors)."""
