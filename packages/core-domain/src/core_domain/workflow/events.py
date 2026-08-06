"""Workflow domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId

from .model import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowStarted(DomainEvent):
    """A workflow instance started."""

    instance_id: EntityId


@dataclass(frozen=True, slots=True)
class StageTransitioned(DomainEvent):
    """A declared transition occurred with its gate satisfied (WFC-16)."""

    instance_id: EntityId
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowCompleted(DomainEvent):
    """A workflow reached COMPLETED with all gates and approvals satisfied (canonical, AV2-18)."""

    instance_id: EntityId


@dataclass(frozen=True, slots=True)
class WorkflowEscalated(DomainEvent):
    """A workflow escalated; integrity/isolation/security escalations halt and reach GRC (WFC-41)."""

    instance_id: EntityId
