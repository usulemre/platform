"""Experiment Classification — the kind/domain classification of an experiment (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ExperimentKind(Enum):
    FACTOR = "factor"
    SIGNAL = "signal"
    RISK = "risk"
    PORTFOLIO = "portfolio"
    EXECUTION = "execution"
    META = "meta"  # meta-research, subject to the same rigor (CI-2)


class ExperimentDomain(Enum):
    EQUITIES = "equities"
    RATES = "rates"
    CREDIT = "credit"
    FX = "fx"
    COMMODITIES = "commodities"
    CROSS_ASSET = "cross_asset"
    ASSET_AGNOSTIC = "asset_agnostic"  # the core never branches on asset class (CP-8)


@dataclass(frozen=True, slots=True)
class ExperimentClassification:
    """The classification of an experiment (drives ontology placement, KM-3)."""

    kind: ExperimentKind
    domain: ExperimentDomain
