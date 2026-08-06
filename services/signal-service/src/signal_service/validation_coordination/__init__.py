"""Signal Validation Coordination — orchestrates validation via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the signal to the deterministic
Validation engine. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class SignalValidationCoordinator(Protocol):
    """Coordinates a signal's validation before APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; significance and the promotion
    decision are the deterministic Validation engine's (P2-*).
    """

    def request_validation(self, signal: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, signal: EntityId) -> ValidationReport: ...
