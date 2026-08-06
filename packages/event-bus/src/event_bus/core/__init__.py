"""Event Core — the canonical event identity, topic, context, and the transported DomainEvent.

Re-exports core_domain.shared.DomainEvent (the canonical event the bus transports) and defines the
event-bus identity/topic/context.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent  # re-export: the canonical transported event
from platform_contracts.common import CorrelationId

from platform_messaging.event_model import EventCategory


@dataclass(frozen=True, slots=True)
class EventIdentifier:
    """A stable, immutable identity for a bus event (traceability, CP-7)."""

    value: str


@dataclass(frozen=True, slots=True)
class EventTopic:
    """A partitioned, ACL-governed event topic on the bus (P5-04).

    ``restricted`` marks validation/OOS topics that generation subscribers MUST NOT bind (the isolation
    barrier, AC-3, P2-07); enforcement is by the concrete bus ACLs, not here.
    """

    name: str
    category: EventCategory
    partitioned: bool
    restricted: bool


@dataclass(frozen=True, slots=True)
class EventContext:
    """Immutable context for an event flow (correlation for end-to-end traceability, CP-7)."""

    correlation_id: CorrelationId
    as_of: str | None


__all__ = ["DomainEvent", "EventIdentifier", "EventTopic", "EventContext"]
