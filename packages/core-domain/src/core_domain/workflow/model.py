"""Workflow domain model — states, transitions, and gates (orchestrate, never adjudicate)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, VersionedId

# --- Value Objects ---------------------------------------------------------


class WorkflowState(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    ESCALATED = "escalated"


@dataclass(frozen=True, slots=True)
class TransitionSpec:
    """A declared transition with pre/postconditions; undeclared transitions are PROHIBITED (WFC-16)."""

    from_state: WorkflowState
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class GateResult:
    """The outcome of a gate; the gate delegates to a deterministic engine or human (WCON-2)."""

    passed: bool
    gate: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class WorkflowDefinition(AggregateRoot):
    """A versioned workflow contract definition (aggregate root)."""

    definition_id: VersionedId
    transitions: tuple[TransitionSpec, ...]


@dataclass(eq=False)
class WorkflowInstance(AggregateRoot):
    """A running workflow instance with an explicit owner and current state."""

    definition: VersionedId
    state: WorkflowState
