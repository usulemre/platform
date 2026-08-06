"""Dispatcher — the dispatcher INTERFACE delivering routed events to subscribers (no queue/broker)."""
from __future__ import annotations

from typing import Protocol

from event_bus.envelope import EventEnvelope


class EventDispatcher(Protocol):
    """Dispatches routed events to subscribers honoring delivery/retry/dead-letter policies. Interface only.

    It never delivers a restricted (validation/OOS) event to a generation subscriber (isolation barrier,
    P2-07). No queue/broker/transport here.
    """

    def dispatch(self, envelope: EventEnvelope) -> None: ...
