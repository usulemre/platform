"""Validation bounded context — the deterministic adjudication core (gauntlet, holdout, gate)."""
from __future__ import annotations

from .contracts import (
    HoldoutEmbargoManager,
    MultipleTestingEnforcer,
    ReplicationEngine,
    ScientificGate,
    ValidationGauntlet,
    ValidationRunRepository,
)
from .errors import LLMValidationAttempt, OOSReuse, ReplicationFailed, UndeflatedSignificance
from .events import CapitalEligibilityIssued, HoldoutConsumed, ValidationCompleted
from .model import (
    DeflatedMetric,
    HoldoutAllocation,
    PBOResult,
    ReplicationResult,
    ValidationRun,
    Verdict,
)

__all__ = [
    "Verdict", "DeflatedMetric", "PBOResult", "HoldoutAllocation", "ReplicationResult",
    "ValidationRun",
    "ValidationCompleted", "HoldoutConsumed", "CapitalEligibilityIssued",
    "ValidationRunRepository", "MultipleTestingEnforcer", "ValidationGauntlet",
    "HoldoutEmbargoManager", "ReplicationEngine", "ScientificGate",
    "OOSReuse", "UndeflatedSignificance", "LLMValidationAttempt", "ReplicationFailed",
]
