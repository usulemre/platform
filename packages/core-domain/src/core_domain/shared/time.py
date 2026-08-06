"""Time value objects. Time is always *supplied* (injected clock), never read here (CS-3, PIT-4)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Timestamp:
    """An instant as an ISO-8601 string (library-free); provided by an injected clock."""

    iso8601: str


@dataclass(frozen=True, slots=True)
class EventTime:
    """When something happened in the world (bitemporal)."""

    at: Timestamp


@dataclass(frozen=True, slots=True)
class KnowledgeTime:
    """When something became known to the platform (bitemporal)."""

    at: Timestamp


@dataclass(frozen=True, slots=True)
class BitemporalStamp:
    """event_time + knowledge_time, enabling correct restatement handling (DI-3)."""

    event_time: EventTime
    knowledge_time: KnowledgeTime


@dataclass(frozen=True, slots=True)
class AsOf:
    """A point-in-time read boundary; a historical read without one is PROHIBITED (PIT-1)."""

    knowledge_time: KnowledgeTime
