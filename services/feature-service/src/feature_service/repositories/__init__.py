"""Feature Repository Interfaces — append-only, immutable repositories (no persistence).

The Feature Marketplace read path is core_domain.feature.FeatureMarketplace; these platform
repositories add version/lineage/dependency retrieval. No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.dependencies import FeatureDependency
from feature_service.lineage import FeatureLineage
from feature_service.model import Feature
from feature_service.versioning import FeatureVersion


class FeatureRepositoryContract(Protocol):
    """Append-only repository of features (immutable; supersede, never mutate, CP-2, FA-4)."""

    def get(self, feature: EntityId) -> Feature: ...
    def add(self, feature: Feature) -> None: ...


class FeatureVersionRepository(Protocol):
    """Append-only repository of immutable feature versions."""

    def get(self, version: EntityId) -> FeatureVersion: ...
    def add(self, version: FeatureVersion) -> None: ...


class FeatureLineageRepository(Protocol):
    """Retrieval of a feature's complete lineage. Interface only."""

    def lineage_of(self, feature: EntityId) -> FeatureLineage: ...


class FeatureDependencyRepository(Protocol):
    """Retrieval of a feature's declared dependencies. Interface only."""

    def dependencies_of(self, feature: EntityId) -> tuple[FeatureDependency, ...]: ...
