"""Signal Classification — the kind/horizon classification of a signal (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SignalKind(Enum):
    DIRECTIONAL = "directional"
    MEAN_REVERSION = "mean_reversion"
    MOMENTUM = "momentum"
    CARRY = "carry"
    VALUE = "value"
    QUALITY = "quality"
    COMPOSITE = "composite"


class SignalHorizon(Enum):
    INTRADAY = "intraday"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    MULTI_MONTH = "multi_month"


@dataclass(frozen=True, slots=True)
class SignalClassification:
    """The classification of a signal (kind + horizon; drives ontology placement, KM-3)."""

    kind: SignalKind
    horizon: SignalHorizon
