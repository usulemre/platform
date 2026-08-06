"""Risk Domain Events — immutable facts about a risk assessment (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class RiskAssessmentRequested(DomainEvent):
    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskAssessmentCompleted(DomainEvent):
    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided)."""

    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskApproved(DomainEvent):
    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskRejected(DomainEvent):
    assessment_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class RiskConstraintViolated(DomainEvent):
    assessment_id: EntityId
    constraint: str


@dataclass(frozen=True, slots=True)
class RiskPolicyUpdated(DomainEvent):
    policy: str


@dataclass(frozen=True, slots=True)
class RiskReportGenerated(DomainEvent):
    assessment_id: EntityId
