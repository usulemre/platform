"""Risk domain model — deterministic limits, assessments, and the human-invocable kill-switch."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Ref

# --- Value Objects ---------------------------------------------------------


class RiskVerdict(Enum):
    WITHIN_LIMITS = "within_limits"
    BREACH = "breach"


@dataclass(frozen=True, slots=True)
class RiskLimit:
    """A deterministic, versioned, testable limit (exposure/leverage/concentration/drawdown)."""

    name: str
    threshold: float


@dataclass(frozen=True, slots=True)
class Exposure:
    """A measured exposure value (descriptive analytics)."""

    name: str
    value: float


@dataclass(frozen=True, slots=True)
class LimitBreach:
    """A recorded breach of a risk limit."""

    limit: RiskLimit
    observed: float


class KillSwitchState(Enum):
    ARMED = "armed"
    ENGAGED = "engaged"  # forces execution into paper/halt (RS-3); human-invocable, never AI-gated


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class RiskLimitSet(AggregateRoot):
    """A versioned set of risk limits (aggregate root)."""

    limits: tuple[RiskLimit, ...]


@dataclass(eq=False)
class RiskAssessment(AggregateRoot):
    """An independent risk assessment of a portfolio/strategy (aggregate root)."""

    subject: Ref  # -> portfolio.Portfolio or strategy.Strategy
    verdict: RiskVerdict
