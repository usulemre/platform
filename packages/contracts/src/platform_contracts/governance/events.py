"""Governance event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ProductionDeploymentApproved(Event):
    """A production deployment was approved (counter-signed for capital) (HO-2, AV2-15)."""

    subject_id: Id


@dataclass(frozen=True, slots=True)
class OverrideRecorded(Event):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class GovernanceHalt(Event):
    reason: str
