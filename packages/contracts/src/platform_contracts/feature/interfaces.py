"""Feature repository, marketplace, and leakage-harness contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import AcceptFeature, AcceptFeatureResponse, FeatureDto


class FeatureRepositoryContract(Protocol):
    def get(self, id: Id) -> FeatureDto: ...
    def add(self, feature: FeatureDto) -> None: ...


class FeatureMarketplaceContract(Protocol):
    def get(self, id: Id) -> FeatureDto: ...


class LeakageHarnessContract(Protocol):
    """Deterministic leakage/look-ahead check; must pass before acceptance (P2-03)."""

    def accept(self, command: AcceptFeature) -> AcceptFeatureResponse: ...
