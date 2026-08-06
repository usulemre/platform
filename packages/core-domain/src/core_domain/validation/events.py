"""Validation domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ValidationCompleted(DomainEvent):
    """A deterministic validation run produced a verdict (VS-1)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class HoldoutConsumed(DomainEvent):
    """The one-shot holdout was consumed for a candidate (SI-4, P2-05)."""

    subject_id: EntityId
    budget_id: str


@dataclass(frozen=True, slots=True)
class CapitalEligibilityIssued(DomainEvent):
    """The scientific gate issued a capital-eligibility token (P2-09)."""

    subject_id: EntityId
    eligibility_token: str
