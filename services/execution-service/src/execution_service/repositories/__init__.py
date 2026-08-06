"""Execution Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from execution_service.model import Execution
from execution_service.planning import ExecutionPlan
from execution_service.session import ExecutionSession


class ExecutionRepositoryContract(Protocol):
    """Append-only repository of executions (immutable; supersede, never mutate, CP-2)."""

    def get(self, execution: EntityId) -> Execution: ...
    def add(self, execution: Execution) -> None: ...


class ExecutionPlanRepository(Protocol):
    """Append-only repository of immutable execution plans. Interface only."""

    def get(self, execution: EntityId) -> ExecutionPlan: ...
    def add(self, execution: EntityId, plan: ExecutionPlan) -> None: ...


class ExecutionSessionRepository(Protocol):
    """Append-only repository of execution sessions. Interface only."""

    def get(self, session: EntityId) -> ExecutionSession: ...
    def add(self, session: ExecutionSession) -> None: ...
