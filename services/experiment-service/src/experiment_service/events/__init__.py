"""Experiment Domain Events — immutable facts about an experiment (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExperimentRegistered(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentConfigured(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentStarted(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentCompleted(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentValidationRequested(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentValidated(DomainEvent):
    """Records that the deterministic validation/scientific gate passed (the engine decided)."""

    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentApproved(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentArchived(DomainEvent):
    experiment_id: EntityId
