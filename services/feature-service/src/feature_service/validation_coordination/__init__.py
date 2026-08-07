"""Feature Validation Coordination — orchestrates the Leakage Harness + structural validation.

Delegates leakage/look-ahead checking to the deterministic Leakage Harness (core_domain.feature) and
structural validation to the Validation Foundation. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.feature import LeakageReport
from core_domain.shared import EntityId
from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class FeatureValidationCoordinator(Protocol):
    """Coordinates a feature's validation before APPROVED/ACTIVE. Interface only.

    The Leakage Harness (deterministic) must pass (FA-2, P2-03); structural validation is orchestrated
    via the Validation Foundation; the service never computes features and never asserts significance.
    """

    def request_leakage_check(self, feature: EntityId) -> LeakageReport: ...
    def request_validation(self, feature: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, feature: EntityId) -> ValidationReport: ...
