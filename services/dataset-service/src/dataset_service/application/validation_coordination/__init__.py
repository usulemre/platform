"""Dataset Validation Coordination — orchestrates structural validation + the certification gate.

Uses the Validation Foundation (platform_validation) for STRUCTURAL validation and delegates
data-quality CERTIFICATION to the deterministic engine (dataset_service.validation_integration).
No statistics here; certification is never asserted by an LLM (AI-2, DI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId
from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class DatasetValidationCoordinator(Protocol):
    """Coordinates a dataset's structural validation and certification before VALIDATED/PUBLISHED.

    Structural validation is orchestrated via the Validation Foundation; certification/leakage/
    survivorship are the deterministic engine's decision (DI-1). Interface only.
    """

    def request_validation(self, dataset: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, dataset: EntityId) -> ValidationReport: ...
    def is_certified(self, dataset: EntityId) -> bool: ...
