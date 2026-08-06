"""Research domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ResearchCreated(DomainEvent):
    """A new idea/research effort was registered (canonical event)."""

    idea_id: EntityId
    title: str


@dataclass(frozen=True, slots=True)
class HypothesisPreRegistered(DomainEvent):
    """A hypothesis's falsifiable prediction and success criteria were frozen (SM-2)."""

    hypothesis_id: EntityId
