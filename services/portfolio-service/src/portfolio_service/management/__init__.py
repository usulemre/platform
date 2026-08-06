"""Portfolio Management — the Portfolio Engine application/service INTERFACES (deterministic; no execution).

Orchestrates the portfolio lifecycle and gates approval on validation + independent risk review. It is
deterministic, net-of-cost, and holds NO execution authority. No AI decides allocation (PS-3, AI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.metadata import PortfolioMetadata
from portfolio_service.model import PortfolioDecision


class PortfolioService(Protocol):
    """The Portfolio Engine service (interface only): drive the portfolio lifecycle."""

    def propose(self, subject: EntityId) -> EntityId: ...
    def construct(self, portfolio: EntityId) -> None: ...
    def submit_for_validation(self, portfolio: EntityId) -> None: ...
    def approve(self, portfolio: EntityId) -> None: ...
    def mark_ready_for_execution(self, portfolio: EntityId) -> None: ...
    def rebalance(self, portfolio: EntityId) -> EntityId: ...
    def archive(self, portfolio: EntityId) -> None: ...


class PortfolioEngineService(Protocol):
    """The deterministic portfolio decision gate: yields a PortfolioDecision. Interface only."""

    def decide(self, subject: EntityId) -> PortfolioDecision: ...


class PortfolioCatalogService(Protocol):
    """Describes portfolios from the catalog/registry. Interface only."""

    def describe(self, portfolio: EntityId) -> PortfolioMetadata: ...
