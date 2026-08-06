"""Signal contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class SignalDto(Dto):
    id: Id
    net_of_cost: bool
    retired: bool


@dataclass(frozen=True, slots=True)
class RegisterSignal(Command):
    feature_id: Id
    definition: str


@dataclass(frozen=True, slots=True)
class RetireSignal(Command):
    signal_id: Id


@dataclass(frozen=True, slots=True)
class GetSignal(Query):
    signal_id: Id


@dataclass(frozen=True, slots=True)
class RegisterSignalResponse(Response):
    signal_id: Id
