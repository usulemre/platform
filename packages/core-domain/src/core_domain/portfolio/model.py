"""Portfolio domain model — immutable, rationale-bearing portfolio snapshots (net-of-cost)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Ref

# --- Value Objects ---------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Weight:
    """A target allocation weight for an eligible alpha (dimensionless)."""

    value: float


@dataclass(frozen=True, slots=True)
class Allocation:
    """A single strategy's allocation within a portfolio (net-of-cost)."""

    strategy: Ref  # -> strategy.Strategy
    weight: Weight


@dataclass(frozen=True, slots=True)
class OptimizationConstraints:
    """Constraints the optimizer must respect (within Risk limits, net-of-cost) (PS-2)."""

    description: str


@dataclass(frozen=True, slots=True)
class PortfolioRationale:
    """The recorded rationale attached to a portfolio snapshot (PS-4)."""

    text: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Portfolio(AggregateRoot):
    """An immutable portfolio snapshot (aggregate root); content-addressed (CP-2, PS-4)."""

    snapshot: ContentAddress
    allocations: tuple[Allocation, ...]
    rationale: PortfolioRationale
    provenance: Provenance
