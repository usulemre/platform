"""Feature Versioning — the immutable feature version and versioning INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import ContentAddress, EntityId

from feature_service.model import FeatureIdentifier


@dataclass(frozen=True, slots=True)
class FeatureVersion:
    """An immutable, content-addressed feature version (CP-2; changes create a new version, FA-4)."""

    feature_id: FeatureIdentifier
    content: ContentAddress
    supersedes: str | None


class FeatureVersioningService(Protocol):
    """Creates new immutable versions and coordinates superseding/rollback. Interface only.

    A new version re-enters validation; historical versions are preserved (VER-2, RP-4).
    """

    def create_version(self, feature: EntityId) -> FeatureVersion: ...
    def supersede(self, old: EntityId, new: EntityId) -> None: ...
    def rollback(self, feature: EntityId, to_version: str) -> None: ...
