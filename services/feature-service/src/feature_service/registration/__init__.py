"""Feature Registration — register-before-use registration into the Feature Registry/Marketplace."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.model import Feature


class FeatureRegistrationService(Protocol):
    """Registers a feature (register-before-use) with a declarative definition and provenance (FA-1/3).

    A feature is accepted into the Marketplace only after the deterministic Leakage Harness passes
    (FA-2, P2-03); the service performs no computation and no adjudication. Interface only.
    """

    def register(self, feature: Feature) -> EntityId: ...
