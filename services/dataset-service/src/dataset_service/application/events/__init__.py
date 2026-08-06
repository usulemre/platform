"""Dataset Service Events — application/service-level events (incl. request signals).

These are the application-layer events of the Dataset Service (distinct from the Phase-2.0 domain
events in dataset_service.events); they include the *Requested command-signals that drive workflows.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class DatasetRegistrationRequested(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetRegistered(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidationRequested(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidated(DomainEvent):
    """Records that the deterministic certification/validation gate passed (DI-1)."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetPublished(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetVersionPromoted(DomainEvent):
    dataset_id: EntityId
    version: str


@dataclass(frozen=True, slots=True)
class DatasetDeprecated(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetArchived(DomainEvent):
    dataset_id: EntityId
