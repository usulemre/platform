"""Governance approval-engine, audit-trail, and tiered-autonomy interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Approval, AuditChainEntry


class ApprovalRepository(Protocol):
    """Append-only repository of human approvals (immutable audit)."""

    def get(self, id: EntityId) -> Approval: ...
    def add(self, approval: Approval) -> None: ...


class AuditTrail(Protocol):
    """Append-only, tamper-evident (hash-chained) audit trail (SEC-4, CP-7)."""

    def append(self, entry: AuditChainEntry) -> None: ...


class ApprovalEngine(Protocol):
    """Interface: routes critical transitions to human approvers; an override defeating a control is void (HO-3)."""

    def request_approval(self, subject: EntityId) -> None: ...


class TieredAutonomyPolicy(Protocol):
    """Interface: scales human oversight without rubber-stamping (P5-05, SC-4)."""

    def required_tier(self, subject: EntityId) -> str: ...
