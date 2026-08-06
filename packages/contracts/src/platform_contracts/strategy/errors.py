"""Strategy error contracts."""
from __future__ import annotations

from enum import Enum


class StrategyErrorCode(Enum):
    NOT_CAPITAL_ELIGIBLE = "strategy.not_capital_eligible"  # RG-1, FB-12
    MISSING_REPLICATION = "strategy.missing_replication"    # VS-4, P2-08
