"""Portfolio Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class PortfolioLifecycle(Enum):
    """The canonical portfolio lifecycle (plus REJECTED)."""

    PROPOSED = "proposed"
    CONSTRUCTING = "constructing"
    VALIDATING = "validating"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    READY_FOR_EXECUTION = "ready_for_execution"
    ARCHIVED = "archived"
    REJECTED = "rejected"


L = PortfolioLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[PortfolioLifecycle, PortfolioLifecycle], ...] = (
    (L.PROPOSED, L.CONSTRUCTING),
    (L.CONSTRUCTING, L.VALIDATING),
    (L.VALIDATING, L.REVIEWED),
    (L.REVIEWED, L.APPROVED),
    (L.APPROVED, L.READY_FOR_EXECUTION),
    (L.READY_FOR_EXECUTION, L.ARCHIVED),
    # reconstruction / rebalancing (produce a new version that re-validates)
    (L.CONSTRUCTING, L.PROPOSED),
    (L.READY_FOR_EXECUTION, L.CONSTRUCTING),
    # revalidation
    (L.READY_FOR_EXECUTION, L.VALIDATING),
    # rejection
    (L.VALIDATING, L.REJECTED),
    (L.REVIEWED, L.REJECTED),
    # retirement
    (L.APPROVED, L.ARCHIVED),
    (L.REJECTED, L.ARCHIVED),
)

#: Terminal state. Rebalancing/reconstruction/versioning produce a NEW versioned portfolio snapshot
#: (with lineage), never a mutation of an approved snapshot (RL-1, PS-4).
TERMINAL_STATES: frozenset[PortfolioLifecycle] = frozenset({L.ARCHIVED})


class PortfolioLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/READY_FOR_EXECUTION require validation + independent risk
    review; the service performs NO adjudication and no AI decides allocation (PS-3, AI-1). Interface only."""

    def transition(self, portfolio: EntityId, to: PortfolioLifecycle) -> None: ...
