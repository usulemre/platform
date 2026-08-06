"""Governance domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ProductionDeploymentApproved(DomainEvent):
    """A production deployment was approved (counter-signed for capital) (HO-2, AV2-15)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class OverrideRecorded(DomainEvent):
    """A human override was recorded with identity, timestamp, and rationale (HO-2)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class GovernanceHalt(DomainEvent):
    """Governance halted an automated process (HO-1, kill-switch authority)."""

    reason: str
