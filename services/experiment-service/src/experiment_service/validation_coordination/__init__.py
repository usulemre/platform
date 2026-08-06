"""Experiment Validation Coordination — orchestrates validation via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the experiment to the
deterministic Validation engine/scientific gate. It never asserts significance (AI-2). No statistics.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class ExperimentValidationCoordinator(Protocol):
    """Coordinates an experiment's validation. Interface only.

    Structural validation is orchestrated via the Validation Foundation; significance/PBO/holdout/
    replication and the promotion decision are the deterministic Validation engine's (DI/VS, P2-*).
    """

    def request_validation(self, experiment: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, experiment: EntityId) -> ValidationReport: ...
