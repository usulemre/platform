"""Feature Registry Integration — the port to the Feature Registry / Marketplace (no persistence).

Integrates with the Feature Registry (FRG): register-before-use, immutable/versioned entries, and
Marketplace publication. Delegates to core_domain.feature repositories; no storage here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.model import Feature


class FeatureRegistryPort(Protocol):
    """The port to the Feature Registry. Interface only — the concrete registry stores elsewhere.

    Registration is append-only and immutable; a change creates a new version (FA-4). Publication to
    the Marketplace requires an accepted (leakage-clean, provenanced) feature.
    """

    def register(self, feature: Feature) -> None: ...
    def publish_to_marketplace(self, feature: EntityId) -> None: ...
    def is_registered(self, feature: EntityId) -> bool: ...
