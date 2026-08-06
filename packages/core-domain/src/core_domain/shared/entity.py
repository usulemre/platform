"""Entity and AggregateRoot bases. Invariants are enforced by outer deterministic engines (DE-1)."""
from __future__ import annotations

from dataclasses import dataclass

from .event import DomainEvent
from .identifiers import EntityId


@dataclass(eq=False)
class Entity:
    """An object with a stable identity across state changes."""

    id: EntityId


@dataclass(eq=False)
class AggregateRoot(Entity):
    """Consistency boundary; the only object a repository loads/stores (immutably, CP-2)."""

    def record_event(self, event: DomainEvent) -> None:
        """Register a domain event for later publication by the application layer. Placeholder."""
        raise NotImplementedError

    def pull_events(self) -> list[DomainEvent]:
        """Return and clear pending domain events. Placeholder — implemented in an outer layer."""
        raise NotImplementedError
