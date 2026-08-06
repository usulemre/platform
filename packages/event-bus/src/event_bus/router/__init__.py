"""Router — the event routing-rule model and router INTERFACE (deterministic; no transport)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.routing import RoutingKey  # reuse

from event_bus.core import EventTopic
from event_bus.envelope import EventEnvelope


@dataclass(frozen=True, slots=True)
class EventRoutingRule:
    """An immutable routing rule: a source pattern to a destination topic + routing key."""

    source_pattern: str
    destination: EventTopic
    routing_key: RoutingKey


class EventRouter(Protocol):
    """Routes an envelope to destination topics deterministically. Interface only — no transport.

    Routing respects topic restrictions (the isolation barrier); it never routes a restricted topic to
    a generation subscriber (P2-07).
    """

    def route(self, envelope: EventEnvelope) -> tuple[EventTopic, ...]: ...
