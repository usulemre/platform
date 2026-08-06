"""Feature error contracts."""
from __future__ import annotations

from enum import Enum


class FeatureErrorCode(Enum):
    LEAKAGE_DETECTED = "feature.leakage_detected"      # P2-03
    LOOK_AHEAD_BIAS = "feature.look_ahead_bias"        # PIT-3, FB-7
    MISSING_PROVENANCE = "feature.missing_provenance"  # FB-11
