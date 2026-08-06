"""Risk Management — the Risk Engine application/service INTERFACES (deterministic gate, no execution).

Orchestrates the risk lifecycle and gates research outputs before signal generation. It is
independent (RS-2), deterministic (RS-1), and holds NO execution authority. No AI decides risk (AI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from risk_service.metadata import RiskMetadata
from risk_service.model import RiskDecision


class RiskService(Protocol):
    """The Risk Engine service (interface only): drive the risk-assessment lifecycle."""

    def request_assessment(self, subject: EntityId) -> EntityId: ...
    def assess(self, assessment: EntityId) -> None: ...
    def submit_for_validation(self, assessment: EntityId) -> None: ...
    def submit_for_review(self, assessment: EntityId) -> None: ...
    def approve(self, assessment: EntityId) -> None: ...
    def activate(self, assessment: EntityId) -> None: ...
    def retire(self, assessment: EntityId) -> None: ...


class RiskEngineService(Protocol):
    """The deterministic risk gate: yields a RiskDecision for a subject. Interface only.

    It gates progression to signal generation; it never executes and no AI decides (RS-1, AI-1).
    """

    def decide(self, subject: EntityId) -> RiskDecision: ...


class RiskCatalogService(Protocol):
    """Describes risk assessments from the catalog. Interface only."""

    def describe(self, assessment: EntityId) -> RiskMetadata: ...
