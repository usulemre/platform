"""Workflow Events — immutable lifecycle events (subclass the contract Event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class WorkflowCreated(Event):
    instance_id: Id
    definition: str


@dataclass(frozen=True, slots=True)
class WorkflowStarted(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowPaused(Event):
    """Instance moved to a holding state (BLOCKED/SUSPENDED)."""

    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowResumed(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowValidated(Event):
    instance_id: Id
    passed: bool


@dataclass(frozen=True, slots=True)
class WorkflowApproved(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowRejected(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowCompleted(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowFailed(Event):
    instance_id: Id
    reason: str


@dataclass(frozen=True, slots=True)
class WorkflowEscalated(Event):
    instance_id: Id
    reason: str
