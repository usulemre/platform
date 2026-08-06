"""Portfolio Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.model import Portfolio, PortfolioCandidate


class PortfolioRepositoryContract(Protocol):
    """Append-only repository of immutable portfolio snapshots (supersede, never mutate, PS-4, CP-2)."""

    def get(self, portfolio: EntityId) -> Portfolio: ...
    def add(self, portfolio: Portfolio) -> None: ...


class PortfolioCandidateRepository(Protocol):
    """Append-only repository of portfolio candidates. Interface only."""

    def get(self, candidate: EntityId) -> PortfolioCandidate: ...
    def add(self, candidate: PortfolioCandidate) -> None: ...
