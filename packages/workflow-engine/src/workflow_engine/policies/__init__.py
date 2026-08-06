"""Workflow Policies — deterministic policy INTERFACES governing transitions (no logic here)."""
from __future__ import annotations

from typing import Protocol

from workflow_engine.state import WorkflowState


class WorkflowPolicy(Protocol):
    """Marker for a deterministic, versioned workflow policy."""

    ...


class StateMachinePolicy(Protocol):
    """Determines whether a transition is legal (WFC-16). Interface only; a deterministic engine implements it."""

    def is_transition_allowed(self, source: WorkflowState, target: WorkflowState) -> bool: ...


class StageSkipPolicy(Protocol):
    """Rejects stage-skipping / research-to-production jumps (WFC-3/17). Interface only."""

    def is_stage_skip(self, source: WorkflowState, target: WorkflowState) -> bool: ...


class GateOwnershipPolicy(Protocol):
    """Resolves which deterministic engine or human owns a given gate (gates delegate, WCON-2)."""

    def gate_owner(self, source: WorkflowState, target: WorkflowState) -> str: ...
