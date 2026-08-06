"""Research Classification — the kind/domain classification of a research initiative (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ResearchKind(Enum):
    FACTOR = "factor"
    SIGNAL = "signal"
    RISK = "risk"
    EXECUTION = "execution"
    PORTFOLIO = "portfolio"
    META = "meta"  # meta-research (subject to the same rigor, CI-2)


class ResearchDomain(Enum):
    EQUITIES = "equities"
    RATES = "rates"
    CREDIT = "credit"
    FX = "fx"
    COMMODITIES = "commodities"
    CROSS_ASSET = "cross_asset"
    ASSET_AGNOSTIC = "asset_agnostic"  # the core never branches on asset class (CP-8)


@dataclass(frozen=True, slots=True)
class ResearchClassification:
    """The classification of a research initiative (drives ontology placement, KM-3)."""

    kind: ResearchKind
    domain: ResearchDomain
