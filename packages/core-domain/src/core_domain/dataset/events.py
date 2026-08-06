"""Dataset domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import EntityId, DomainEvent


@dataclass(frozen=True, slots=True)
class DatasetRegistered(DomainEvent):
    """A dataset version was registered."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidated(DomainEvent):
    """A dataset passed certification and is safe for research (canonical event, DI-1)."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class VintageRecorded(DomainEvent):
    """A restatement was recorded as a new vintage (DI-3)."""

    dataset_id: EntityId
    vintage_id: EntityId
