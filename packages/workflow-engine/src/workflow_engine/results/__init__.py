"""Workflow Results — the immutable result and error records of a workflow run (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Id

from workflow_engine.state import WorkflowState


class WorkflowResultStatus(Enum):
    SUCCESS = "success"
    FAILURE = "failure"


@dataclass(frozen=True, slots=True)
class WorkflowError:
    """An immutable error record for a failed workflow (a structured fact, not an exception)."""

    code: str
    message: str


@dataclass(frozen=True, slots=True)
class WorkflowResult:
    """The immutable outcome of a workflow run."""

    instance_id: Id
    status: WorkflowResultStatus
    final_state: WorkflowState
    error: WorkflowError | None
