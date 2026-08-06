"""Allocation Management — the position/allocation model and management INTERFACE (no math here).

Allocations reuse core_domain.portfolio.Weight/Allocation. Weights are produced by the deterministic
optimizer; this module holds NO allocation mathematics.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.portfolio import Weight
from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class PortfolioPosition:
    """A single position: an eligible signal/instrument and its target weight (net-of-cost, PS-2)."""

    signal_ref: Ref  # -> signal_service (capital-eligible signal, PS-1)
    weight: Weight


@dataclass(frozen=True, slots=True)
class PortfolioAllocation:
    """An immutable set of positions (the allocation of a portfolio candidate)."""

    positions: tuple[PortfolioPosition, ...]


class AllocationManagementService(Protocol):
    """Manages the allocation produced by the deterministic optimizer. Interface only — no math here.

    An LLM MUST NOT decide allocation/sizing (PS-3, AI-1); weights come from the deterministic optimizer.
    """

    def allocation_of(self, portfolio: EntityId) -> PortfolioAllocation: ...
