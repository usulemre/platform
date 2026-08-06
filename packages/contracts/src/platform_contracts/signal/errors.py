"""Signal error contracts."""
from __future__ import annotations

from enum import Enum


class SignalErrorCode(Enum):
    GROSS_SELECTION = "signal.gross_selection"                    # AD-1, AP-10
    GENERATOR_OBSERVED_VALIDATION = "signal.generator_observed_validation"  # P2-07
