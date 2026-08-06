"""Portfolio contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class AllocationDto(Dto):
    strategy_id: Id
    weight: float


@dataclass(frozen=True, slots=True)
class PortfolioDto(Dto):
    id: Id
    allocations: tuple[AllocationDto, ...]


@dataclass(frozen=True, slots=True)
class ConstructPortfolio(Command):
    """Construct from capital-eligible alphas only, net-of-cost, within limits (PS-1/2)."""

    eligible_strategy_ids: tuple[Id, ...]
    constraints: str


@dataclass(frozen=True, slots=True)
class GetPortfolio(Query):
    portfolio_id: Id


@dataclass(frozen=True, slots=True)
class ConstructPortfolioResponse(Response):
    portfolio: PortfolioDto
