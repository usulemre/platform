"""Domain event base. Events are immutable, past-tense facts — records, never commands."""
from __future__ import annotations

from dataclasses import dataclass

from .identifiers import EntityId
from .time import KnowledgeTime


@dataclass(frozen=True, slots=True)
class DomainEventMeta:
    """Envelope metadata carried by every domain event (CP-7 auditability)."""

    event_id: EntityId
    aggregate_id: EntityId
    occurred_at: KnowledgeTime  # supplied by an injected clock, never now() (CS-3)


@dataclass(frozen=True, slots=True)
class DomainEvent:
    """Base for all domain events. Subclasses add immutable, value-typed fields only."""

    meta: DomainEventMeta
