"""Signal Domain Events — immutable facts about a signal (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class SignalGenerated(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided)."""

    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalApproved(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalRejected(DomainEvent):
    signal_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class SignalActivated(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalSuperseded(DomainEvent):
    signal_id: EntityId
    superseded_by: EntityId


@dataclass(frozen=True, slots=True)
class SignalRetired(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalScoreUpdated(DomainEvent):
    signal_id: EntityId
    score: float


@dataclass(frozen=True, slots=True)
class SignalRegistryUpdated(DomainEvent):
    signal_id: EntityId
