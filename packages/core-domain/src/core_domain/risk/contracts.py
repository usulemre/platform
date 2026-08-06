"""Risk repository, limit-engine, and kill-switch interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import ActorRef, EntityId

from .model import RiskAssessment, RiskLimitSet, RiskVerdict


class RiskLimitRepository(Protocol):
    """Append-only repository of versioned risk-limit sets."""

    def get(self, id: EntityId) -> RiskLimitSet: ...
    def add(self, limits: RiskLimitSet) -> None: ...


class RiskAssessmentRepository(Protocol):
    """Append-only repository of independent risk assessments."""

    def get(self, id: EntityId) -> RiskAssessment: ...
    def add(self, assessment: RiskAssessment) -> None: ...


class RiskLimitEngine(Protocol):
    """Interface: deterministic limit evaluation (RS-1). Deterministic engine implements it."""

    def evaluate(self, subject: EntityId) -> RiskVerdict: ...


class KillSwitch(Protocol):
    """Interface: forces execution to paper/halt; human-invocable, NEVER AI-gated (RS-3, HO-4)."""

    def engage(self, invoked_by: ActorRef) -> None: ...
