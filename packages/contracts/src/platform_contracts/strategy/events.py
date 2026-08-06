"""Strategy event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class StrategyRegistered(Event):
    strategy_id: Id


@dataclass(frozen=True, slots=True)
class StrategyApproved(Event):
    """Canonical event: a strategy passed the scientific gate and received an eligibility token."""

    strategy_id: Id
    eligibility_token: str


@dataclass(frozen=True, slots=True)
class StrategyRetired(Event):
    strategy_id: Id
