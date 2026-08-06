"""Event Versioning — event schema identity and compatibility policy (VER-1/2). Interfaces + data."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import SchemaVersion


class Compatibility(Enum):
    NONE = "none"
    BACKWARD = "backward"
    FORWARD = "forward"
    FULL = "full"


@dataclass(frozen=True, slots=True)
class EventSchema:
    """The versioned identity of an event schema (a breaking change bumps major, VER-1)."""

    name: str
    version: SchemaVersion
    compatibility: Compatibility


class SchemaRegistry(Protocol):
    """Governs event-schema evolution; rejects incompatible changes (VER-2). Interface only."""

    def is_compatible(self, current: EventSchema, candidate: EventSchema) -> bool: ...


__all__ = ["Compatibility", "EventSchema", "SchemaRegistry"]
