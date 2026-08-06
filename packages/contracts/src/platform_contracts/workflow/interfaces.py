"""Workflow engine, gate-evaluator, and compensator contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    AdvanceWorkflow,
    GateResultDto,
    StartWorkflow,
    StartWorkflowResponse,
    WorkflowInstanceDto,
)


class WorkflowRepositoryContract(Protocol):
    def get(self, id: Id) -> WorkflowInstanceDto: ...
    def add(self, instance: WorkflowInstanceDto) -> None: ...


class RunLedgerContract(Protocol):
    """Append-only run ledger recording every workflow run (WCON-3, OB-1)."""

    def record(self, instance_id: Id) -> None: ...


class WorkflowEngineContract(Protocol):
    """Orchestrates transitions; it NEVER adjudicates (WCON-2, AV2-18)."""

    def start(self, command: StartWorkflow) -> StartWorkflowResponse: ...
    def advance(self, command: AdvanceWorkflow) -> None: ...


class GateEvaluatorContract(Protocol):
    """Delegates a gate to its owning deterministic engine or human approver."""

    def evaluate(self, instance_id: Id, gate: str) -> GateResultDto: ...


class CompensatorContract(Protocol):
    """Saga compensation so partial failures leave consistent state (WFC-19, RE-1)."""

    def compensate(self, instance_id: Id) -> None: ...
