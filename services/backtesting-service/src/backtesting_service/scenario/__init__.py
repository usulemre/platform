"""Scenario Management — named scenario variants over a configuration (data + interface)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class BacktestScenario:
    """A named, immutable scenario (parameter/regime variant) over a configuration."""

    name: str
    config_hash: str
    overrides: tuple[tuple[str, str], ...]


class ScenarioManagementService(Protocol):
    """Defines and lists scenarios for a backtest. Interface only."""

    def define_scenario(self, backtest: EntityId, scenario: BacktestScenario) -> None: ...
