"""Subscriber — the event subscription model and subscriber INTERFACE (ACL/isolation-aware; no broker)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import DomainEvent

from event_bus.core import EventTopic


@dataclass(frozen=True, slots=True)
class EventSubscription:
    """An immutable subscription of a subscriber to a topic (optionally filtered)."""

    subscriber_id: str
    topic: EventTopic
    filter_ref: str | None


class EventSubscriber(Protocol):
    """Subscribes to a topic and handles delivered events. Interface only — no broker/queue here.

    Binding is subject to ACLs: a generation subscriber MUST NOT bind a restricted (validation/OOS)
    topic (the isolation barrier, AC-3, P2-07). Delivered events are acknowledged for traceability.
    """

    def subscribe(self, subscription: EventSubscription) -> None: ...
    def handle(self, event: DomainEvent) -> None: ...
    def acknowledge(self, event_id: str) -> None: ...
