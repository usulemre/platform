"""Workflow Transition — declared transitions with pre/postconditions (data only, no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from workflow_engine.state import WorkflowState


class TransitionKind(Enum):
    """The nature of a transition (drives which gate/point applies)."""

    NORMAL = "normal"
    VALIDATION_GATE = "validation_gate"    # delegates to a deterministic validation engine
    APPROVAL_POINT = "approval_point"      # requires a human approval (HO-2)
    ROLLBACK_POINT = "rollback_point"      # saga compensation / rollback (WFC-19)
    ESCALATION = "escalation"              # escalation path (WFC-41)


@dataclass(frozen=True, slots=True)
class WorkflowTransition:
    """A single directed transition between two states."""

    source: WorkflowState
    target: WorkflowState
    kind: TransitionKind


@dataclass(frozen=True, slots=True)
class TransitionSpec:
    """A transition plus its named pre/postconditions (evaluated by an outer deterministic engine).

    The condition names are references; this layer holds NO evaluation logic (WCON-2).
    """

    transition: WorkflowTransition
    precondition: str
    postcondition: str
