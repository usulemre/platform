"""Portfolio Policies — allocation/constraint governance policy INTERFACES (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class PortfolioPolicy(Protocol):
    """Marker for a deterministic, versioned portfolio policy."""

    ...


class AllocationPolicy(Protocol):
    """Governs how allocation is produced: net-of-cost, deterministic, no AI sizing (PS-2/3). Interface only."""

    def is_net_of_cost(self, portfolio: EntityId) -> bool: ...
    def is_deterministic(self, portfolio: EntityId) -> bool: ...


class ConstraintPolicy(Protocol):
    """Governs mandatory constraint enforcement (incl. risk constraints); hard breaches block (PS-2, RS-1). Interface only."""

    def constraints_respected(self, portfolio: EntityId) -> bool: ...


class EligibleAlphaPolicy(Protocol):
    """Only capital-eligible signals may be constituents; never re-adjudicate (PS-1). Interface only."""

    def all_constituents_eligible(self, portfolio: EntityId) -> bool: ...


class DeterministicAllocationPolicy(Protocol):
    """Allocation/sizing is deterministic; an LLM MUST NOT decide it (PS-3, AI-1). Interface only."""

    def is_engine_decided(self, portfolio: EntityId) -> bool: ...


class NoExecutionAuthorityPolicy(Protocol):
    """The Portfolio Engine constructs but NEVER executes (boundary). Interface only."""

    def has_no_execution_authority(self, portfolio: EntityId) -> bool: ...
