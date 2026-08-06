"""Feature Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class FeatureLifecycle(Enum):
    """The canonical feature lifecycle."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    IMPLEMENTED = "implemented"
    VALIDATING = "validating"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


L = FeatureLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[FeatureLifecycle, FeatureLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.IMPLEMENTED),
    (L.IMPLEMENTED, L.VALIDATING),
    (L.VALIDATING, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.DEPRECATED),
    (L.DEPRECATED, L.ARCHIVED),
    # revision (fix and re-validate)
    (L.IMPLEMENTED, L.REGISTERED),
    (L.VALIDATING, L.IMPLEMENTED),
    # superseding / rollback (governed reactivation of a rolled-back-to version)
    (L.DEPRECATED, L.ACTIVE),
)

#: Terminal state. Branching a feature creates a NEW versioned feature (with lineage), never a
#: mutation of history (RL-1) — ARCHIVED has no outbound transition here.
TERMINAL_STATES: frozenset[FeatureLifecycle] = frozenset({L.ARCHIVED})


class FeatureLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/ACTIVE require the deterministic Leakage Harness and
    validation gate to have passed (FA-2); the service performs NO adjudication. Interface only."""

    def transition(self, feature: EntityId, to: FeatureLifecycle) -> None: ...
