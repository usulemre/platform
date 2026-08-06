"""Portfolio Optimization Interface — the deterministic optimizer contract (no algorithm here).

The concrete optimizer is deterministic, net-of-cost, and constraint-respecting (PS-2), versioned and
golden-tested (DE-1/2). NO optimization algorithm or allocation mathematics here. Reuses
core_domain.portfolio.PortfolioOptimizer / OptimizationConstraints.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.portfolio import OptimizationConstraints, PortfolioOptimizer  # reuse
from core_domain.shared import EntityId

from portfolio_service.allocation import PortfolioAllocation


class PortfolioOptimizationInterface(Protocol):
    """The deterministic, net-of-cost portfolio optimizer interface. Interface only.

    It produces an allocation from eligible signals subject to constraints; an LLM MUST NOT decide
    allocation/sizing (PS-3, AI-1); it optimizes net-of-cost, never gross (PS-2).
    """

    def optimize(self, portfolio: EntityId, constraints: OptimizationConstraints) -> PortfolioAllocation: ...


__all__ = ["OptimizationConstraints", "PortfolioOptimizer", "PortfolioOptimizationInterface"]
