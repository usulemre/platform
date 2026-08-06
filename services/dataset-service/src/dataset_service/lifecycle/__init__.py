"""Dataset Lifecycle — the canonical lifecycle states, transitions, and the lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class DatasetLifecycle(Enum):
    """The canonical dataset lifecycle."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    VALIDATING = "validating"
    VALIDATED = "validated"
    PUBLISHED = "published"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


L = DatasetLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[DatasetLifecycle, DatasetLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.VALIDATING),
    (L.VALIDATING, L.VALIDATED),
    (L.VALIDATING, L.REGISTERED),   # validation not yet passed -> back to registered
    (L.VALIDATED, L.PUBLISHED),
    (L.PUBLISHED, L.DEPRECATED),
    (L.DEPRECATED, L.ARCHIVED),
    # a new version of a published dataset re-enters validation (version upgrade / schema evolution)
    (L.PUBLISHED, L.VALIDATING),
)

#: Terminal state.
TERMINAL_STATES: frozenset[DatasetLifecycle] = frozenset({L.ARCHIVED})


class DatasetLifecycleService(Protocol):
    """Governs lifecycle transitions; a transition to VALIDATED/PUBLISHED requires the deterministic
    certification/validation gate to have passed (DI-1). Interface only — no logic here."""

    def transition(self, dataset: EntityId, to: DatasetLifecycle) -> None: ...
