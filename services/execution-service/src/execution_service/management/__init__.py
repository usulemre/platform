"""Execution Management — the Execution Engine application/service INTERFACES (plans only; no execution).

Orchestrates the execution lifecycle and gates authorization on validation + parity + risk + a valid
governance token. It is deterministic and produces PLANS only; no AI executes/authorizes (AI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from execution_service.metadata import ExecutionMetadata
from execution_service.model import ExecutionDecision


class ExecutionService(Protocol):
    """The Execution Engine service (interface only): drive the execution planning/authorization lifecycle."""

    def request(self, portfolio: EntityId) -> EntityId: ...
    def plan(self, execution: EntityId) -> None: ...
    def submit_for_validation(self, execution: EntityId) -> None: ...
    def authorize(self, execution: EntityId) -> None: ...
    def mark_ready(self, execution: EntityId) -> None: ...
    def cancel(self, execution: EntityId) -> None: ...
    def archive(self, execution: EntityId) -> None: ...


class ExecutionEngineService(Protocol):
    """The deterministic execution decision gate: yields an ExecutionDecision. Interface only.

    It produces plans and authorization decisions only; it never submits orders and no AI decides (AI-1).
    """

    def decide(self, execution: EntityId) -> ExecutionDecision: ...


class ExecutionCatalogService(Protocol):
    """Describes executions from the catalog. Interface only."""

    def describe(self, execution: EntityId) -> ExecutionMetadata: ...
