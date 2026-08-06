"""Governance approval-engine, audit-trail, and tiered-autonomy contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import ApprovalDto, ApprovalResponse, RequestApproval


class ApprovalRepositoryContract(Protocol):
    def get(self, id: Id) -> ApprovalDto: ...
    def add(self, approval: ApprovalDto) -> None: ...


class AuditTrailContract(Protocol):
    """Append-only, tamper-evident (hash-chained) audit trail (SEC-4, CP-7)."""

    def append(self, entry_hash: str, prev_hash: str) -> None: ...


class ApprovalEngineContract(Protocol):
    """Routes critical transitions to human approvers; a control-defeating override is void (HO-3)."""

    def request_approval(self, command: RequestApproval) -> ApprovalResponse: ...


class TieredAutonomyPolicyContract(Protocol):
    """Scales human oversight without rubber-stamping (P5-05, SC-4)."""

    def required_tier(self, subject_id: Id) -> str: ...
