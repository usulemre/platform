"""Signal domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class SignalGenerated(DomainEvent):
    """A signal was generated from accepted features (canonical event)."""

    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalRetired(DomainEvent):
    """A decayed/crowded signal was retired through the governed lifecycle (RL-2)."""

    signal_id: EntityId
