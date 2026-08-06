"""Workflow Approval — the human-approval interface at approval points (humans approve, not AI)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import ActorRef

from workflow_engine.context import WorkflowContext


class ApprovalDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class WorkflowApproval:
    """An immutable record of a human approval at an approval point (HO-2).

    ``counter_signed`` is required for capital-affecting approvals (HO-2, AV2-15).
    """

    approver: ActorRef
    decision: ApprovalDecision
    counter_signed: bool
    rationale: str


class WorkflowApprovalGate(Protocol):
    """Requests a human approval at an approval point; a human decides, never AI (HO-1). Interface only."""

    def request(self, context: WorkflowContext) -> WorkflowApproval: ...
