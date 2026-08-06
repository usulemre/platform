"""Filtering — the event filter model and evaluator INTERFACE (deterministic; no logic here)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from event_bus.envelope import EventEnvelope


class EventFilterKind(Enum):
    CATEGORY = "category"
    SOURCE = "source"
    TYPE = "type"
    HEADER = "header"


@dataclass(frozen=True, slots=True)
class EventFilter:
    """A declarative, immutable event filter (evaluated by a deterministic evaluator; no logic here)."""

    kind: EventFilterKind
    expression: str


class EventFilterEvaluator(Protocol):
    """Evaluates a filter against an envelope deterministically. Interface only."""

    def matches(self, envelope: EventEnvelope, filter: EventFilter) -> bool: ...
