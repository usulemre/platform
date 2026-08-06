"""Scheduling Policies — the versioned schedule policy model and governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id, SchemaVersion


@dataclass(frozen=True, slots=True)
class SchedulePolicy:
    """A named, versioned, deterministic schedule policy. Immutable; a change is a new version."""

    name: str
    version: SchemaVersion
    description: str


class DeterministicSchedulingPolicy(Protocol):
    """Scheduling is deterministic; no timers/wall-clock and no cron parsing (DE-1, CS-3). Interface only."""

    def is_deterministic(self, job: Id) -> bool: ...


class DependencyAwarePolicy(Protocol):
    """A job runs only after its declared dependencies are satisfied (dependency-aware). Interface only."""

    def dependencies_satisfied(self, job: Id) -> bool: ...


class RegisterBeforeSchedulePolicy(Protocol):
    """A job is registered before it can be scheduled. Interface only."""

    def is_registered(self, job: Id) -> bool: ...


class NoDistributedSchedulingPolicy(Protocol):
    """This layer performs no distributed scheduling or infrastructure (boundary). Interface only."""

    def is_abstraction_only(self, job: Id) -> bool: ...
