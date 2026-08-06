"""Event Validation — STRUCTURAL validation of an event envelope before publish (never statistical)."""
from __future__ import annotations

from typing import Protocol

from platform_messaging.validation import ValidationResult  # reuse structural result

from event_bus.envelope import EventEnvelope


class EventValidator(Protocol):
    """Structurally validates an event envelope before publish. Interface only.

    It checks the event type is registered, the schema matches, the header is complete (correlation
    present), and the event is a canonical domain event. Structural only — never statistical (AI-2).
    """

    def validate(self, envelope: EventEnvelope) -> ValidationResult: ...


__all__ = ["EventValidator", "ValidationResult"]
