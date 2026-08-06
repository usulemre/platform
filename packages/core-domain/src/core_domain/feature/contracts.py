"""Feature repository, marketplace, and leakage-harness interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Feature, LeakageReport


class FeatureRepository(Protocol):
    """Append-only repository of feature versions (immutable; changes create a new version, FA-4)."""

    def get(self, id: EntityId) -> Feature: ...
    def add(self, feature: Feature) -> None: ...


class FeatureMarketplace(Protocol):
    """Read view over accepted features (marketplace)."""

    def get(self, id: EntityId) -> Feature: ...


class LeakageHarness(Protocol):
    """Interface: evaluates a feature for leakage/look-ahead. Deterministic engine implements it."""

    def check(self, feature: EntityId) -> LeakageReport: ...
