"""Portfolio repository and optimizer contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import ConstructPortfolio, ConstructPortfolioResponse, PortfolioDto


class PortfolioRepositoryContract(Protocol):
    def get(self, id: Id) -> PortfolioDto: ...
    def add(self, portfolio: PortfolioDto) -> None: ...


class PortfolioOptimizerContract(Protocol):
    """Deterministic, net-of-cost optimization; an LLM MUST NOT decide allocation (PS-3, AI-1)."""

    def construct(self, command: ConstructPortfolio) -> ConstructPortfolioResponse: ...
