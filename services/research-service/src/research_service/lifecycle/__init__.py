"""Research Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ResearchLifecycle(Enum):
    """The canonical research lifecycle (plus SUSPENDED for suspension/reopening)."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    DESIGNED = "designed"
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    VALIDATED = "validated"
    APPROVED = "approved"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"


L = ResearchLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ResearchLifecycle, ResearchLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.DESIGNED),
    (L.DESIGNED, L.ACTIVE),
    (L.ACTIVE, L.UNDER_REVIEW),
    (L.UNDER_REVIEW, L.VALIDATED),
    (L.VALIDATED, L.APPROVED),
    (L.APPROVED, L.ARCHIVED),
    # revisions
    (L.ACTIVE, L.DESIGNED),
    (L.UNDER_REVIEW, L.ACTIVE),
    (L.UNDER_REVIEW, L.DESIGNED),
    # suspension / reopening
    (L.DESIGNED, L.SUSPENDED),
    (L.ACTIVE, L.SUSPENDED),
    (L.UNDER_REVIEW, L.SUSPENDED),
    (L.SUSPENDED, L.ACTIVE),
    (L.SUSPENDED, L.ARCHIVED),
)

#: Terminal state. Reopening a KILLED/ARCHIVED effort creates a NEW versioned lineage (a branch),
#: never a mutation of history (RL-1) — hence ARCHIVED has no outbound transition here.
TERMINAL_STATES: frozenset[ResearchLifecycle] = frozenset({L.ARCHIVED})


class ResearchLifecycleService(Protocol):
    """Governs lifecycle transitions. A transition to VALIDATED/APPROVED requires the deterministic
    validation/scientific gate to have passed; the service performs NO adjudication. Interface only."""

    def transition(self, research: EntityId, to: ResearchLifecycle) -> None: ...
