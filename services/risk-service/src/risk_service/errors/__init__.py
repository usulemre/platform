"""Risk Errors — Risk Engine domain errors (each expresses a violated risk-governance invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class RiskError(DomainError):
    """Base for Risk Engine errors."""


class AIRiskDecision(RiskError):
    """An AI attempted to decide a risk verdict/halt (RS-1, AI-1)."""


class RiskIndependenceViolation(RiskError):
    """Risk oversight was not independent of research/portfolio (RS-2, CP-5)."""


class HardConstraintBreach(RiskError):
    """A hard risk constraint/limit was breached; progression is blocked (RS-1)."""


class ExecutionAuthorityAttempt(RiskError):
    """The Risk Engine attempted execution or to authorize execution (out of scope, boundary)."""


class GovernanceBypass(RiskError):
    """An override attempted to bypass a hard risk control (HO-3; void)."""


class MissingPerformanceEvidence(RiskError):
    """A risk assessment lacked the required Backtesting performance evidence."""


class IllegalRiskTransition(RiskError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
