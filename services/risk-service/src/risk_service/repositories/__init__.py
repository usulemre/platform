"""Risk Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from risk_service.model import RiskAssessment
from risk_service.reporting import RiskReport


class RiskAssessmentRepositoryContract(Protocol):
    """Append-only repository of risk assessments (immutable; supersede, never mutate, CP-2)."""

    def get(self, assessment: EntityId) -> RiskAssessment: ...
    def add(self, assessment: RiskAssessment) -> None: ...


class RiskReportRepository(Protocol):
    """Append-only repository of immutable risk reports. Interface only."""

    def get(self, assessment: EntityId) -> RiskReport: ...
    def add(self, report: RiskReport) -> None: ...
