"""Risk Classification — the category/severity classification of a risk (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class RiskCategory(Enum):
    MARKET = "market"
    LIQUIDITY = "liquidity"
    CONCENTRATION = "concentration"
    LEVERAGE = "leverage"
    DRAWDOWN = "drawdown"
    MODEL = "model"
    OPERATIONAL = "operational"
    CROWDING = "crowding"


class RiskSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True, slots=True)
class RiskClassification:
    """The classification of a risk assessment (category + severity)."""

    category: RiskCategory
    severity: RiskSeverity
