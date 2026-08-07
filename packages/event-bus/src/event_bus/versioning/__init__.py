"""Event Versioning — the event version model and migration INTERFACE (reuses the messaging schema registry)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import SchemaVersion
from platform_messaging.versioning import Compatibility, EventSchema, SchemaRegistry  # reuse


@dataclass(frozen=True, slots=True)
class EventVersion:
    """The versioned identity of an event type (a breaking change bumps major, VER-1)."""

    event_type: str
    version: SchemaVersion
    compatibility: Compatibility


class EventVersionMigration(Protocol):
    """Migrates an event across compatible versions (version-migration support). Interface only.

    Historical events remain interpretable under the version in which they were produced (VER-2).
    """

    def migrate(self, event_type: str, to: SchemaVersion) -> None: ...


__all__ = [
    "EventVersion", "EventVersionMigration", "Compatibility", "EventSchema", "SchemaRegistry",
]
