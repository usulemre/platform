"""Strategy contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class StrategyDto(Dto):
    id: Id
    lifecycle: str
    capital_eligibility_token: str | None  # None until issued (RG-1)


@dataclass(frozen=True, slots=True)
class RegisterStrategy(Command):
    signal_id: Id


@dataclass(frozen=True, slots=True)
class RetireStrategy(Command):
    strategy_id: Id


@dataclass(frozen=True, slots=True)
class GetStrategy(Query):
    strategy_id: Id


@dataclass(frozen=True, slots=True)
class RegisterStrategyResponse(Response):
    strategy_id: Id
