"""Research event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ResearchCreated(Event):
    """Canonical event: a new idea/research effort was registered."""

    idea_id: Id
    title: str


@dataclass(frozen=True, slots=True)
class HypothesisPreRegistered(Event):
    hypothesis_id: Id
