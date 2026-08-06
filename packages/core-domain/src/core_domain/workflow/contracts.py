"""Workflow engine, gate-evaluator, and compensator interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import GateResult, WorkflowInstance


class WorkflowInstanceRepository(Protocol):
    """Append-only repository of workflow instances (immutable run history)."""

    def get(self, id: EntityId) -> WorkflowInstance: ...
    def add(self, instance: WorkflowInstance) -> None: ...


class RunLedger(Protocol):
    """Append-only run ledger recording every workflow run (WCON-3, OB-1)."""

    def record(self, instance: EntityId) -> None: ...


class WorkflowEngine(Protocol):
    """Interface: orchestrates transitions; it NEVER adjudicates (WCON-2, AV2-18)."""

    def advance(self, instance: EntityId) -> None: ...


class GateEvaluator(Protocol):
    """Interface: delegates a gate to its owning deterministic engine or human approver."""

    def evaluate(self, instance: EntityId, gate: str) -> GateResult: ...


class Compensator(Protocol):
    """Interface: saga compensation so partial failures leave consistent state (WFC-19, RE-1)."""

    def compensate(self, instance: EntityId) -> None: ...
