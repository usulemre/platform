"""Strategy domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class StrategyRegistered(DomainEvent):
    """A strategy was registered."""

    strategy_id: EntityId


@dataclass(frozen=True, slots=True)
class StrategyApproved(DomainEvent):
    """A strategy passed the scientific gate and received a capital-eligibility token (canonical)."""

    strategy_id: EntityId
    eligibility_token: str


@dataclass(frozen=True, slots=True)
class StrategyRetired(DomainEvent):
    """A strategy was retired through the governed lifecycle (RL-2)."""

    strategy_id: EntityId
