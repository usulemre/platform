"""Signal Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class SignalLifecycle(Enum):
    """The canonical signal lifecycle (plus REJECTED)."""

    PROPOSED = "proposed"
    GENERATED = "generated"
    VALIDATING = "validating"
    APPROVED = "approved"
    ACTIVE = "active"
    SUPERSEDED = "superseded"
    RETIRED = "retired"
    REJECTED = "rejected"


L = SignalLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[SignalLifecycle, SignalLifecycle], ...] = (
    (L.PROPOSED, L.GENERATED),
    (L.GENERATED, L.VALIDATING),
    (L.VALIDATING, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.SUPERSEDED),
    (L.SUPERSEDED, L.RETIRED),
    # revision
    (L.GENERATED, L.PROPOSED),
    (L.VALIDATING, L.GENERATED),
    # replacement / expiration
    (L.ACTIVE, L.RETIRED),
    # revalidation
    (L.ACTIVE, L.VALIDATING),
    # rejection
    (L.VALIDATING, L.REJECTED),
    (L.APPROVED, L.REJECTED),
    (L.REJECTED, L.RETIRED),
)

#: Terminal state. Replacement creates a NEW versioned signal (with lineage), superseding the old (RL-1).
TERMINAL_STATES: frozenset[SignalLifecycle] = frozenset({L.RETIRED})


class SignalLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/ACTIVE require validation AND a mandatory Risk approval
    (RS-1); the service performs NO adjudication and no AI/ML decides (AI-1, DE-1). Interface only."""

    def transition(self, signal: EntityId, to: SignalLifecycle) -> None: ...
