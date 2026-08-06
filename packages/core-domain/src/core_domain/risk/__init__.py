"""Risk bounded context — independent, deterministic limits and the kill-switch."""
from __future__ import annotations

from .contracts import (
    KillSwitch,
    RiskAssessmentRepository,
    RiskLimitEngine,
    RiskLimitRepository,
)
from .errors import AIHaltAttempt, HardLimitBreach, RiskIndependenceViolation
from .events import KillSwitchEngaged, LimitBreached, RiskValidated
from .model import (
    Exposure,
    KillSwitchState,
    LimitBreach,
    RiskAssessment,
    RiskLimit,
    RiskLimitSet,
    RiskVerdict,
)

__all__ = [
    "RiskVerdict", "RiskLimit", "Exposure", "LimitBreach", "KillSwitchState",
    "RiskLimitSet", "RiskAssessment",
    "RiskValidated", "LimitBreached", "KillSwitchEngaged",
    "RiskLimitRepository", "RiskAssessmentRepository", "RiskLimitEngine", "KillSwitch",
    "HardLimitBreach", "AIHaltAttempt", "RiskIndependenceViolation",
]
