"""Portfolio repository and optimizer interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import OptimizationConstraints, Portfolio


class PortfolioRepository(Protocol):
    """Append-only repository of immutable portfolio snapshots (PS-4)."""

    def get(self, id: EntityId) -> Portfolio: ...
    def add(self, portfolio: Portfolio) -> None: ...


class PortfolioOptimizer(Protocol):
    """Interface: deterministic, net-of-cost optimization within constraints (PS-2, PS-3).

    Implemented by a deterministic engine; an LLM MUST NOT decide allocation or sizing.
    """

    def construct(self, constraints: OptimizationConstraints) -> Portfolio: ...
