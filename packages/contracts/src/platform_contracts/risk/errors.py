"""Risk error contracts."""
from __future__ import annotations

from enum import Enum


class RiskErrorCode(Enum):
    HARD_LIMIT_BREACH = "risk.hard_limit_breach"          # RS-1
    AI_HALT_ATTEMPT = "risk.ai_halt_attempt"              # AI-1, RS-1
    INDEPENDENCE_VIOLATION = "risk.independence_violation"  # RS-2, CP-5
