"""Feature Classification — the kind/domain classification of a feature (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class FeatureKind(Enum):
    PRICE = "price"
    VOLUME = "volume"
    FUNDAMENTAL = "fundamental"
    SENTIMENT = "sentiment"
    MICROSTRUCTURE = "microstructure"
    CROSS_SECTIONAL = "cross_sectional"
    TIME_SERIES = "time_series"
    DERIVED = "derived"


class FeatureDomain(Enum):
    EQUITIES = "equities"
    RATES = "rates"
    CREDIT = "credit"
    FX = "fx"
    COMMODITIES = "commodities"
    CROSS_ASSET = "cross_asset"
    ASSET_AGNOSTIC = "asset_agnostic"  # the core never branches on asset class (CP-8)


@dataclass(frozen=True, slots=True)
class FeatureClassification:
    """The classification of a feature (drives ontology placement, KM-3)."""

    kind: FeatureKind
    domain: FeatureDomain
