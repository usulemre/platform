"""Research domain model — ideas and pre-registered, falsifiable hypotheses."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AggregateRoot, EntityId, VersionedId

# --- Value Objects ---------------------------------------------------------


@dataclass(frozen=True, slots=True)
class FalsifiablePrediction:
    """The testable, refutable claim of a hypothesis (SM-1)."""

    statement: str


@dataclass(frozen=True, slots=True)
class SuccessCriteria:
    """Frozen success criteria; post-hoc alteration is p-hacking and PROHIBITED (SM-2)."""

    description: str


@dataclass(frozen=True, slots=True)
class EconomicRationale:
    """Falsifiable economic mechanism required before promotion (AD-2, EXP-1)."""

    thesis: str


@dataclass(frozen=True, slots=True)
class PreRegistration:
    """The immutable pre-registration frozen before any evaluation (SM-2, P3-02)."""

    prediction: FalsifiablePrediction
    criteria: SuccessCriteria
    universe: str
    horizon: str
    planned_test: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Idea(AggregateRoot):
    """A registered idea — the entry point of the research lifecycle (SM-1)."""

    title: str
    rationale: EconomicRationale


@dataclass(eq=False)
class Hypothesis(AggregateRoot):
    """A pre-registered, falsifiable hypothesis (aggregate root)."""

    hypothesis_id: VersionedId
    idea: EntityId
    pre_registration: PreRegistration | None  # None until locked; set once, never mutated

# --- Specifications / Policies / Factories (interfaces are in contracts.py) --
