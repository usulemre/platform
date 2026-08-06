"""Dependency Management — the job dependency model and dependency-scheduler INTERFACE (no algorithm).

Supports dependency-aware scheduling: a job runs only after its upstream dependencies are satisfied.
Dependencies are declared by identity (SE-2); no scheduling/cycle-detection algorithm here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class DependencyKind(Enum):
    COMPLETION = "completion"            # upstream job completed
    DATA_AVAILABILITY = "data_availability"  # upstream data available (as-of)
    APPROVAL = "approval"                # a governance approval was granted
    WINDOW = "window"                    # an execution window opened


@dataclass(frozen=True, slots=True)
class JobDependency:
    """A declared dependency of a job on an upstream artifact/job, by identity."""

    kind: DependencyKind
    upstream_ref: str


class DependencyScheduler(Protocol):
    """Resolves a job's dependencies and readiness deterministically. Interface only.

    A job is ready only when all its dependencies are satisfied; the concrete implementation performs
    the (acyclic) ordering. No scheduling algorithm or cycle-detection code here.
    """

    def dependencies_of(self, job: Id) -> tuple[JobDependency, ...]: ...
    def is_ready(self, job: Id) -> bool: ...
