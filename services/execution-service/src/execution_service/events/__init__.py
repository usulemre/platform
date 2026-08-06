"""Execution Domain Events — immutable facts about an execution (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExecutionRequested(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionPlanned(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionValidated(DomainEvent):
    """Records that the deterministic validation + parity gate passed (the engine decided)."""

    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionAuthorized(DomainEvent):
    """Records that execution was authorized under a valid governance token (RS-4)."""

    execution_id: EntityId
    authorization_token: str


@dataclass(frozen=True, slots=True)
class ExecutionRejected(DomainEvent):
    execution_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class ExecutionPrepared(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionCompleted(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionCancelled(DomainEvent):
    execution_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class ExecutionArchived(DomainEvent):
    execution_id: EntityId
