"""Risk Validation Coordination — orchestrates validation of the risk assessment via the Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes model-risk validation to the
deterministic engine. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class RiskValidationCoordinator(Protocol):
    """Coordinates a risk assessment's validation before REVIEWED/APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; statistical model-risk
    validation is the deterministic engine's; it asserts no significance.
    """

    def request_validation(self, assessment: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, assessment: EntityId) -> ValidationReport: ...
