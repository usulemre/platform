"""Feature Domain Events — immutable facts about a feature (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class FeatureRegistered(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureVersionCreated(DomainEvent):
    feature_id: EntityId
    version: str


@dataclass(frozen=True, slots=True)
class FeatureValidated(DomainEvent):
    """Records that the deterministic Leakage Harness + validation gate passed (FA-2)."""

    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureApproved(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureActivated(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureDeprecated(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureArchived(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureDependencyAdded(DomainEvent):
    feature_id: EntityId
    dependency_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureLineageUpdated(DomainEvent):
    feature_id: EntityId
