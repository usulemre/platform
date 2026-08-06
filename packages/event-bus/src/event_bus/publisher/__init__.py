"""Publisher — the canonical event publisher INTERFACE (registered domain events only; no broker)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import DomainEvent

from event_bus.core import EventTopic


class EventPublisher(Protocol):
    """Publishes a canonical domain event to a topic. Interface only — no broker/queue here.

    Only registered event types may be published; publication is traceable (correlation) and the event
    is a canonical domain event (domain events only).
    """

    def publish(self, topic: EventTopic, event: DomainEvent) -> None: ...
