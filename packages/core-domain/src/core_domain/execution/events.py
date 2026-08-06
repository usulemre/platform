"""Execution domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExecutionAuthorized(DomainEvent):
    """Live execution was authorized by a valid, time-boxed governance token (canonical, RS-4)."""

    order_id: EntityId
    authorization_token: str


@dataclass(frozen=True, slots=True)
class FillRecorded(DomainEvent):
    """A fill was recorded to the position ledger."""

    order_id: EntityId


@dataclass(frozen=True, slots=True)
class ParityBreachDetected(DomainEvent):
    """A research-to-production parity breach was detected and blocks execution (P3-15)."""

    order_id: EntityId
