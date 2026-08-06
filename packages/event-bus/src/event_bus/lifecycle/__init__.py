"""Event Lifecycle — the canonical event lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from event_bus.core import EventIdentifier


class EventLifecycle(Enum):
    """The canonical event lifecycle (plus FAILED and DEAD_LETTER)."""

    CREATED = "created"
    VALIDATED = "validated"
    PUBLISHED = "published"
    ROUTED = "routed"
    DELIVERED = "delivered"
    ACKNOWLEDGED = "acknowledged"
    ARCHIVED = "archived"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"


L = EventLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[EventLifecycle, EventLifecycle], ...] = (
    (L.CREATED, L.VALIDATED),
    (L.VALIDATED, L.PUBLISHED),
    (L.PUBLISHED, L.ROUTED),
    (L.ROUTED, L.DELIVERED),
    (L.DELIVERED, L.ACKNOWLEDGED),
    (L.ACKNOWLEDGED, L.ARCHIVED),
    # validation failure
    (L.CREATED, L.FAILED),
    (L.VALIDATED, L.FAILED),
    # delivery failure / retry
    (L.DELIVERED, L.FAILED),
    (L.FAILED, L.ROUTED),          # retry
    (L.FAILED, L.DEAD_LETTER),     # exhausted -> dead-letter routing
    # replay from dead-letter
    (L.DEAD_LETTER, L.PUBLISHED),
    (L.DEAD_LETTER, L.ARCHIVED),
)

#: Terminal state. Replay re-publishes a NEW delivery of an event (with lineage), never a mutation.
TERMINAL_STATES: frozenset[EventLifecycle] = frozenset({L.ARCHIVED})


class EventLifecycleService(Protocol):
    """Governs event lifecycle transitions and supported operations. Interface only.

    Supports retry, replay, filtering, version migration, and dead-letter routing; no infrastructure here.
    """

    def transition(self, event: EventIdentifier, to: EventLifecycle) -> None: ...
    def retry(self, event: EventIdentifier) -> None: ...
    def replay(self, event: EventIdentifier) -> None: ...
