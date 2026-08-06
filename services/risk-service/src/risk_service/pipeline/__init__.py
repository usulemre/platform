"""Risk Evaluation Pipeline — a composable, deterministic pipeline of risk checks (no numerical logic).

Composes constraint, limit, exposure, and policy checks into a deterministic evaluation that yields a
RiskDecision. It runs NO numerical VaR/stress algorithms — those plug in behind the check interfaces.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId

from risk_service.model import RiskDecision


class RiskCheckKind(Enum):
    CONSTRAINT = "constraint"
    LIMIT = "limit"
    EXPOSURE = "exposure"
    POLICY = "policy"


@dataclass(frozen=True, slots=True)
class RiskEvaluationStage:
    """One deterministic stage of the risk evaluation pipeline."""

    name: str
    kind: RiskCheckKind
    blocking: bool  # a blocking hard-check failure stops progression (RS-1)


@dataclass(frozen=True, slots=True)
class RiskEvaluationPlan:
    """A declarative, composable plan of risk-evaluation stages."""

    stages: tuple[RiskEvaluationStage, ...]


class RiskEvaluationPipeline(Protocol):
    """Runs the deterministic risk-evaluation pipeline, yielding a deterministic RiskDecision. Interface only."""

    def evaluate(self, assessment: EntityId, plan: RiskEvaluationPlan) -> RiskDecision: ...
