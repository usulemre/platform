"""Portfolio Reporting — the portfolio report model and reporting INTERFACE (references, not math).

Attribution/exposure metrics are computed by deterministic engines and referenced here; this module
computes no statistics or mathematics.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.exposure import PortfolioExposure
from portfolio_service.model import PortfolioSummary


@dataclass(frozen=True, slots=True)
class PortfolioReport:
    """An immutable, explainable portfolio report (references deterministic outputs, EXP-2)."""

    portfolio_id: EntityId
    summary: PortfolioSummary
    exposures: tuple[PortfolioExposure, ...]
    breaches: tuple[str, ...]


class PortfolioReportingService(Protocol):
    """Generates an immutable, explainable portfolio report. Interface only — no computation."""

    def generate(self, portfolio: EntityId) -> PortfolioReport: ...
