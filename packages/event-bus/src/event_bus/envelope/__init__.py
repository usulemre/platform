"""Event Envelope — the transport-neutral envelope wrapping a canonical domain event (data only).

It carries a canonical DomainEvent + metadata + topic; no serialization or transport here.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent

from event_bus.core import EventIdentifier, EventTopic
from event_bus.metadata import EventMetadata


@dataclass(frozen=True, slots=True)
class EventEnvelope:
    """The immutable, transport-neutral envelope.

    ``event`` is a canonical domain event (the bus transports domain events only); ``payload_type`` is
    its fully-qualified type name. No serialized bytes and no transport concern here.
    """

    event_id: EventIdentifier
    event: DomainEvent
    metadata: EventMetadata
    topic: EventTopic
    payload_type: str
