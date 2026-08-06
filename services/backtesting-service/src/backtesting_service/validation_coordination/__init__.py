"""Backtest Validation Coordination — orchestrates validation via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the backtest to the deterministic
Validation engine (deflation/PBO/holdout/replication). It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class BacktestValidationCoordinator(Protocol):
    """Coordinates a backtest's validation before COMPLETED/APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; deflation/PBO/holdout/
    replication and the promotion decision are the deterministic Validation engine's (SI-3, P2-*).
    """

    def request_validation(self, backtest: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, backtest: EntityId) -> ValidationReport: ...
