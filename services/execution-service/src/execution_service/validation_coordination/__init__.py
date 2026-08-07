"""Execution Validation — orchestrates validation incl. research-to-production parity (P3-15).

Uses the Validation Foundation for STRUCTURAL validation and the parity harness for research↔production
parity; a parity breach blocks authorization (P3-15). It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.execution import ParityReport
from core_domain.shared import EntityId
from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class ExecutionValidationCoordinator(Protocol):
    """Coordinates an execution's validation before AUTHORIZED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; research-to-production parity
    is checked via the deterministic parity harness — a breach blocks authorization (P3-15).
    """

    def request_validation(self, execution: EntityId, context: ValidationContext) -> None: ...
    def check_parity(self, execution: EntityId) -> ParityReport: ...
    def collect_report(self, execution: EntityId) -> ValidationReport: ...
