"""Execution contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class ExecutionMode(Enum):
    PAPER = "paper"  # default (DEP-1)
    LIVE = "live"
    HALT = "halt"


@dataclass(frozen=True, slots=True)
class AuthorizationTokenDto(Dto):
    id: str
    expires_at: str  # ISO-8601; time-boxed (RS-4)


@dataclass(frozen=True, slots=True)
class OrderDto(Dto):
    id: Id
    mode: ExecutionMode


@dataclass(frozen=True, slots=True)
class ParityReportDto(Dto):
    within_tolerance: bool


@dataclass(frozen=True, slots=True)
class AuthorizeExecution(Command):
    """Live execution requires a valid, time-boxed governance token; AI never authorizes (AI-1)."""

    order_id: Id
    token: AuthorizationTokenDto


@dataclass(frozen=True, slots=True)
class GetOrder(Query):
    order_id: Id


@dataclass(frozen=True, slots=True)
class AuthorizeExecutionResponse(Response):
    order: OrderDto
