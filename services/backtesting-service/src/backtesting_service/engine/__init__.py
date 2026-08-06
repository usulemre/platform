"""Backtest Engine & Runner Interfaces — the deterministic engine contract (no algorithm here).

The concrete engine is versioned, golden-tested, and reproducible (DE-1/2); the SAME engine runs
backtest/paper/live differing only by injected clock and adapter (AV2-23). No simulation algorithm,
no statistics, no broker/market connectivity here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef

from backtesting_service.context import BacktestContext
from backtesting_service.result_management import BacktestResult
from backtesting_service.scenario import BacktestScenario


class BacktestEngine(Protocol):
    """The deterministic backtest engine. Interface only.

    ``run`` executes a deterministic simulation under the injected (simulated) clock and returns the
    Run Manifest of the reproducible result. It reads only point-in-time data (PIT-1/4) and never
    connects to a broker/market.
    """

    def run(self, backtest: EntityId, context: BacktestContext) -> RunManifestRef: ...


class BacktestRunner(Protocol):
    """Coordinates a single deterministic run of a scenario under a context. Interface only."""

    def execute(
        self, backtest: EntityId, scenario: BacktestScenario, context: BacktestContext
    ) -> BacktestResult: ...
