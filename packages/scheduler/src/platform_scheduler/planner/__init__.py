"""Execution Planner — the deterministic, dependency-aware execution plan model and planner INTERFACE.

Produces a reproducible, dependency-ordered plan honoring dependencies and execution windows. No
scheduling algorithm or timers here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_scheduler.core import SchedulerContext


@dataclass(frozen=True, slots=True)
class ExecutionPlanEntry:
    """An immutable entry in an execution plan: a job and its deterministic order."""

    job: Id
    order: int


@dataclass(frozen=True, slots=True)
class ExecutionPlan:
    """An immutable, reproducible, dependency-ordered execution plan."""

    entries: tuple[ExecutionPlanEntry, ...]


class ExecutionPlanner(Protocol):
    """Produces a deterministic, dependency-aware execution plan. Interface only — no algorithm/timers.

    The plan honors dependencies and execution windows and is reproducible from the context.
    """

    def plan(self, context: SchedulerContext) -> ExecutionPlan: ...
