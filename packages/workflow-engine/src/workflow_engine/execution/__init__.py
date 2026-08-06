"""Workflow Execution — the engine/runner/compensator INTERFACES (orchestrate, never adjudicate)."""
from __future__ import annotations

from typing import Protocol

from workflow_engine.context import WorkflowContext
from workflow_engine.definition import Workflow
from workflow_engine.instance import WorkflowInstance
from workflow_engine.state import WorkflowState


class WorkflowEngine(Protocol):
    """Orchestrates a workflow through declared transitions; it NEVER adjudicates (WCON-2, AV2-18).

    ``advance`` moves an instance to a declared target after that transition's gate/approval passes;
    an undeclared transition is rejected fail-closed (WFC-16). Interface only — no orchestration
    logic, no infrastructure, no persistence here (the engine implementation is Temporal, per TDR).
    """

    def start(self, workflow: Workflow, context: WorkflowContext) -> WorkflowInstance: ...
    def advance(
        self, instance: WorkflowInstance, target: WorkflowState, context: WorkflowContext
    ) -> WorkflowInstance: ...


class StageRunner(Protocol):
    """Runs the work of a single stage by invoking its owning engine/agent. Interface only."""

    def run(self, instance: WorkflowInstance, context: WorkflowContext) -> WorkflowInstance: ...


class Compensator(Protocol):
    """Saga compensation / rollback so partial failures leave consistent state (WFC-19, RE-1)."""

    def compensate(self, instance: WorkflowInstance, context: WorkflowContext) -> WorkflowInstance: ...


class WorkflowExecution(Protocol):
    """Marker for an execution binding (engine + runner + compensator). Interface only."""

    ...
