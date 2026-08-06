"""Feature Discovery — the Feature Marketplace discovery INTERFACE (over accepted features)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from feature_service.classification import FeatureClassification
from feature_service.metadata import FeatureMetadata


@dataclass(frozen=True, slots=True)
class FeatureDiscoveryQuery:
    """An immutable feature-discovery query."""

    text: str | None
    classification: FeatureClassification | None
    active_only: bool


@dataclass(frozen=True, slots=True)
class FeatureDiscoveryResult:
    """The immutable result of a feature-discovery query (metadata only)."""

    matches: tuple[FeatureMetadata, ...]


class FeatureDiscovery(Protocol):
    """Discovers features from the Feature Marketplace. Interface only — no storage."""

    def search(self, query: FeatureDiscoveryQuery) -> FeatureDiscoveryResult: ...
