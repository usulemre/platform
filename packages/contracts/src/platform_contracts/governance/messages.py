"""Governance contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import ActorRef, Command, Dto, Id, Query, Response


class ApprovalDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class CapitalEligibilityTokenDto(Dto):
    id: str
    subject_id: Id


@dataclass(frozen=True, slots=True)
class ApprovalDto(Dto):
    subject_id: Id
    decision: ApprovalDecision
    counter_signed: bool  # required for capital-affecting approvals (HO-2)


@dataclass(frozen=True, slots=True)
class RequestApproval(Command):
    subject_id: Id
    approver: ActorRef


@dataclass(frozen=True, slots=True)
class RecordOverride(Command):
    """A human override; MUST NOT bypass statistical/risk controls (HO-3); rationale required (HO-2)."""

    subject_id: Id
    approver: ActorRef
    rationale: str


@dataclass(frozen=True, slots=True)
class IssueCapitalEligibility(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class GetApproval(Query):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class ApprovalResponse(Response):
    approval: ApprovalDto
