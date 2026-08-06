"""Workflow event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id

from .messages import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowStarted(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class StageTransitioned(Event):
    instance_id: Id
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowCompleted(Event):
    """Canonical event: a workflow reached COMPLETED with all gates and approvals (AV2-18)."""

    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowEscalated(Event):
    instance_id: Id
