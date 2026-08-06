"""Feature bounded context — declarative, PIT-bound, leakage-clean features."""
from __future__ import annotations

from .contracts import FeatureMarketplace, FeatureRepository, LeakageHarness
from .errors import LeakageDetected, LookAheadBias, MissingFeatureProvenance
from .events import FeatureAccepted, FeatureProposed
from .model import AcceptanceStatus, Feature, FeatureSpec, LeakageReport

__all__ = [
    "AcceptanceStatus", "FeatureSpec", "LeakageReport", "Feature",
    "FeatureProposed", "FeatureAccepted",
    "FeatureRepository", "FeatureMarketplace", "LeakageHarness",
    "LeakageDetected", "LookAheadBias", "MissingFeatureProvenance",
]
