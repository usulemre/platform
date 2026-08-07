"""Portfolio Validation — orchestrates validation of a portfolio via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the portfolio to the deterministic
Validation/Risk engines. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId
from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class PortfolioValidationCoordinator(Protocol):
    """Coordinates a portfolio's validation before REVIEWED/APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; constraint/risk validation is
    the deterministic engines'; independent risk review is required before approval (RS-1/2).
    """

    def request_validation(self, portfolio: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, portfolio: EntityId) -> ValidationReport: ...
