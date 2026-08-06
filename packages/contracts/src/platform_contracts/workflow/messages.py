"""Workflow contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class WorkflowState(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    ESCALATED = "escalated"


@dataclass(frozen=True, slots=True)
class GateResultDto(Dto):
    gate: str
    passed: bool


@dataclass(frozen=True, slots=True)
class WorkflowInstanceDto(Dto):
    id: Id
    state: WorkflowState


@dataclass(frozen=True, slots=True)
class StartWorkflow(Command):
    definition_id: Id


@dataclass(frozen=True, slots=True)
class AdvanceWorkflow(Command):
    """Advance only via a declared transition whose gate passed (WFC-16, AV2-18)."""

    instance_id: Id
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class GetWorkflowInstance(Query):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class StartWorkflowResponse(Response):
    instance_id: Id
