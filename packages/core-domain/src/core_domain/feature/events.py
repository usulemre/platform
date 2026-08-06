"""Feature domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class FeatureProposed(DomainEvent):
    """A feature definition was proposed (advisory, pre-acceptance)."""

    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureAccepted(DomainEvent):
    """A feature passed the leakage harness and acceptance gate (canonical event, FA-1..4)."""

    feature_id: EntityId
