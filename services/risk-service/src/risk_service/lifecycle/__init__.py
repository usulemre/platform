"""Risk Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class RiskLifecycle(Enum):
    """The canonical risk-assessment lifecycle (plus REJECTED)."""

    REQUESTED = "requested"
    ASSESSING = "assessing"
    VALIDATING = "validating"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    ACTIVE = "active"
    RETIRED = "retired"
    REJECTED = "rejected"


L = RiskLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[RiskLifecycle, RiskLifecycle], ...] = (
    (L.REQUESTED, L.ASSESSING),
    (L.ASSESSING, L.VALIDATING),
    (L.VALIDATING, L.REVIEWED),
    (L.REVIEWED, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.RETIRED),
    # reassessment (policy/constraint revision triggers a new assessment)
    (L.ACTIVE, L.ASSESSING),
    (L.APPROVED, L.ASSESSING),
    # rejection
    (L.VALIDATING, L.REJECTED),
    (L.REVIEWED, L.REJECTED),
    # governed exception re-review
    (L.APPROVED, L.REVIEWED),
    # retirement of a rejected assessment
    (L.REJECTED, L.RETIRED),
)

#: Terminal state.
TERMINAL_STATES: frozenset[RiskLifecycle] = frozenset({L.RETIRED})


class RiskLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/ACTIVE require the deterministic assessment + review;
    the service performs NO adjudication and no AI decides risk (RS-1, AI-1). Interface only."""

    def transition(self, assessment: EntityId, to: RiskLifecycle) -> None: ...
