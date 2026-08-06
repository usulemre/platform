"""Feature Management — the Feature Service application/orchestration INTERFACES (no adjudication).

Orchestrates the feature lifecycle and connects Data Platform/Research/Experiment/Validation/Feature
Registry. It ORCHESTRATES and RECORDS; it NEVER computes features and NEVER adjudicates (CP-5, AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.dependencies import FeatureDependency
from feature_service.metadata import FeatureMetadata
from feature_service.model import Feature


class FeatureService(Protocol):
    """The Feature Service (interface only): drive the lifecycle of a feature."""

    def register(self, feature: Feature) -> EntityId: ...
    def implement(self, feature: EntityId) -> None: ...
    def submit_for_validation(self, feature: EntityId) -> None: ...
    def approve(self, feature: EntityId) -> None: ...
    def activate(self, feature: EntityId) -> None: ...
    def deprecate(self, feature: EntityId) -> None: ...
    def archive(self, feature: EntityId) -> None: ...


class FeatureManagementService(Protocol):
    """Orchestrates dependencies/lineage and records deterministic gate outcomes. Interface only."""

    def declare_dependency(self, feature: EntityId, dependency: FeatureDependency) -> None: ...
    def record_validation_outcome(self, feature: EntityId, passed: bool) -> None: ...


class FeatureCatalogService(Protocol):
    """Describes features from the catalog/marketplace. Interface only."""

    def describe(self, feature: EntityId) -> FeatureMetadata: ...
