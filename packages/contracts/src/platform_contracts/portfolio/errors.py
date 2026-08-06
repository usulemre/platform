"""Portfolio error contracts."""
from __future__ import annotations

from enum import Enum


class PortfolioErrorCode(Enum):
    INELIGIBLE_ALPHA = "portfolio.ineligible_alpha"        # PS-1
    GROSS_OPTIMIZATION = "portfolio.gross_optimization"    # PS-2
    CONSTRAINT_VIOLATION = "portfolio.constraint_violation"  # PS-2
