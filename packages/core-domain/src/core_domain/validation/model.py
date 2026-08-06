"""Validation domain model — the deterministic gauntlet, one-shot holdout, replication, gate."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Ref

# --- Value Objects ---------------------------------------------------------


class Verdict(Enum):
    PASS = "pass"
    FAIL = "fail"


@dataclass(frozen=True, slots=True)
class DeflatedMetric:
    """A performance statistic deflated for the effective number of trials (SI-3, P2-02)."""

    name: str
    value: float


@dataclass(frozen=True, slots=True)
class PBOResult:
    """Probability of backtest overfitting (descriptive)."""

    probability: float


@dataclass(frozen=True, slots=True)
class HoldoutAllocation:
    """A one-shot, budgeted, rotating out-of-sample allocation; reuse is PROHIBITED (SI-4, P2-05)."""

    budget_id: str
    consumed: bool


@dataclass(frozen=True, slots=True)
class ReplicationResult:
    """Independent replication by a separate code path (VS-4, P2-08)."""

    reproduced: bool


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class ValidationRun(AggregateRoot):
    """A deterministic validation run over a candidate (aggregate root)."""

    subject: Ref  # -> feature.Feature / signal.Signal / strategy.Strategy
    verdict: Verdict
