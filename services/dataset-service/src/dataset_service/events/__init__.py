"""Dataset Domain Events — immutable facts about a dataset (subclass the domain event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class DatasetRegistered(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidated(DomainEvent):
    """The dataset passed the deterministic certification/validation gate (DI-1)."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetPublished(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetDeprecated(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetArchived(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetVersionCreated(DomainEvent):
    dataset_id: EntityId
    version: str


@dataclass(frozen=True, slots=True)
class DatasetSchemaUpdated(DomainEvent):
    dataset_id: EntityId
    schema_version: str


@dataclass(frozen=True, slots=True)
class DatasetOwnershipTransferred(DomainEvent):
    dataset_id: EntityId
    from_role: str
    to_role: str
