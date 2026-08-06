"""Event Registry — the register-before-publish registry of event types/schemas (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import SchemaVersion

from platform_messaging.event_model import EventCategory


@dataclass(frozen=True, slots=True)
class EventRegistration:
    """An immutable registration of a canonical event type (register-before-publish)."""

    event_type: str
    category: EventCategory
    version: SchemaVersion
    source_context: str


class EventRegistry(Protocol):
    """Register-before-publish registry of event types/schemas. Interface only — no persistence.

    Only registered, versioned canonical event types may be published (VER-1/2); an unregistered event
    type is rejected fail-closed.
    """

    def register(self, registration: EventRegistration) -> None: ...
    def is_registered(self, event_type: str) -> bool: ...
    def get(self, event_type: str) -> EventRegistration: ...
