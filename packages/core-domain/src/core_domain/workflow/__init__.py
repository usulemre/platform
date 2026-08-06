"""Workflow bounded context — states, transitions, and gates (orchestrate, never adjudicate)."""
from __future__ import annotations

from .contracts import (
    Compensator,
    GateEvaluator,
    RunLedger,
    WorkflowEngine,
    WorkflowInstanceRepository,
)
from .errors import GateBypassed, InconsistentState, StageSkipped, UndeclaredTransition
from .events import StageTransitioned, WorkflowCompleted, WorkflowEscalated, WorkflowStarted
from .model import (
    GateResult,
    TransitionSpec,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowState,
)

__all__ = [
    "WorkflowState", "TransitionSpec", "GateResult",
    "WorkflowDefinition", "WorkflowInstance",
    "WorkflowStarted", "StageTransitioned", "WorkflowCompleted", "WorkflowEscalated",
    "WorkflowInstanceRepository", "RunLedger", "WorkflowEngine", "GateEvaluator", "Compensator",
    "UndeclaredTransition", "StageSkipped", "GateBypassed", "InconsistentState",
]
