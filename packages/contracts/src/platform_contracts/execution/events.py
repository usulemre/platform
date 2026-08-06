"""Execution event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ExecutionAuthorized(Event):
    """Canonical event: live execution was authorized by a valid governance token (RS-4)."""

    order_id: Id
    authorization_token: str


@dataclass(frozen=True, slots=True)
class FillRecorded(Event):
    order_id: Id


@dataclass(frozen=True, slots=True)
class ParityBreachDetected(Event):
    order_id: Id
