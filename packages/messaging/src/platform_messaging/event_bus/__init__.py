"""Event Bus Abstraction — publisher/subscriber/bus INTERFACES over a partitioned, ACL'd bus."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.event_model import Event


@dataclass(frozen=True, slots=True)
class Topic:
    """A partitioned, ACL-governed topic on the bus (P5-04).

    ``restricted`` marks validation/OOS topics that generation subscribers MUST NOT bind (the
    isolation barrier, P2-07). Enforcement is by the concrete bus ACLs, not here.
    """

    name: str
    partitioned: bool
    restricted: bool


class EventPublisher(Protocol):
    """Publishes an event to a topic. Interface only."""

    def publish(self, topic: Topic, event: Event) -> None: ...


class EventSubscriber(Protocol):
    """Subscribes to a topic. Interface only. Binding is subject to ACLs (isolation barrier)."""

    def subscribe(self, topic: Topic) -> None: ...


class EventBus(Protocol):
    """Abstraction over the partitioned, ACL'd message bus (Architecture V2 §5.2/§5.10, P5-04).

    The concrete bus (Kafka, per the TDR) enforces topic ACLs so a generation subscriber cannot bind
    a validation/OOS topic (AV2-16, P2-07). No broker/transport/serialization here. Interface only.
    """

    def publisher(self) -> EventPublisher: ...
    def subscriber(self) -> EventSubscriber: ...
