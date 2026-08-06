"""Risk Reporting — the risk report model and reporting INTERFACE (explainable; references only)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId

from risk_service.exposure import RiskExposure
from risk_service.model import RiskDecision


@dataclass(frozen=True, slots=True)
class RiskReport:
    """An immutable, explainable risk report (EXP-2).

    It references the deterministic decision, measured exposures, and any breaches; it computes no
    numerical risk.
    """

    assessment_id: EntityId
    decision: RiskDecision
    exposures: tuple[RiskExposure, ...]
    breaches: tuple[str, ...]


class RiskReportingService(Protocol):
    """Generates an immutable, explainable risk report from an assessment. Interface only."""

    def generate(self, assessment: EntityId) -> RiskReport: ...
