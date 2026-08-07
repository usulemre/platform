"""Dataset Validation Integration — bridges the platform to the Validation Foundation & certification.

STRUCTURAL validation uses the Validation Foundation; data-quality CERTIFICATION and survivorship/
leakage checks are the deterministic engines' domain (RB-06/07). No statistical significance here (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId
from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class DatasetStructuralValidation(Protocol):
    """Runs structural validation of a dataset via the Validation Foundation. Interface only.

    Structural/schema validation only; it asserts NO statistical significance and issues NO
    certification verdict (that is the deterministic certification engine, DI-1).
    """

    def validate_structure(self, dataset: EntityId, context: ValidationContext) -> ValidationReport: ...


class DatasetCertificationGate(Protocol):
    """The deterministic certification gate a dataset must pass before VALIDATED/PUBLISHED. Interface only.

    Delegates to the deterministic certification/quality engine (RB-06/07); the platform never
    certifies data with an LLM or by convention.
    """

    def is_certified(self, dataset: EntityId) -> bool: ...
