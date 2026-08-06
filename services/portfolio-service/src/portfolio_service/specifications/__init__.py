"""Portfolio Specifications — composable STRUCTURAL predicates over portfolios (no mathematics).

These check structural readiness/governance prerequisites (eligible constituents, constraints declared,
rationale present), NOT numerical exposures/weights — those are the deterministic engines' outputs.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TPortfolio = TypeVar("TPortfolio", contravariant=True)


class PortfolioSpecification(Protocol[TPortfolio]):
    """A composable, deterministic structural predicate over a portfolio. Interface only."""

    def is_satisfied_by(self, portfolio: TPortfolio) -> bool: ...


class ReadyForApprovalSpecification(Protocol[TPortfolio]):
    """Structural readiness for approval (constructed, validated, constraints respected, rationale present).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, portfolio: TPortfolio) -> bool: ...


class EligibleConstituentsSpecification(Protocol[TPortfolio]):
    """Structural check that all constituents are capital-eligible signals (PS-1). Interface only."""

    def is_satisfied_by(self, portfolio: TPortfolio) -> bool: ...
