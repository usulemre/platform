"""Message Routing — routing keys, routes, partitions, and the Router interface (data + interface)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.message_model import MessageEnvelope


@dataclass(frozen=True, slots=True)
class RoutingKey:
    """A deterministic key used to route/partition a message (no ambient inputs)."""

    value: str


@dataclass(frozen=True, slots=True)
class TopicPartition:
    """A concrete topic partition (P5-04)."""

    topic: str
    partition: int


@dataclass(frozen=True, slots=True)
class Route:
    """The resolved destination for a message."""

    destination_topic: str
    routing_key: RoutingKey


class Router(Protocol):
    """Resolves an envelope to a route deterministically. Interface only — no transport."""

    def route(self, envelope: MessageEnvelope) -> Route: ...
