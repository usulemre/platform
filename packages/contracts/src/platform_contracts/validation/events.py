"""Validation event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ValidationCompleted(Event):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class HoldoutConsumed(Event):
    subject_id: Id
    budget_id: str


@dataclass(frozen=True, slots=True)
class CapitalEligibilityIssued(Event):
    """The scientific gate issued a capital-eligibility token (P2-09)."""

    subject_id: Id
    eligibility_token: str
