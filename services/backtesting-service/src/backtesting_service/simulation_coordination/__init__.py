"""Historical Simulation Coordination — coordinates the deterministic simulation (no algorithm here).

Delegates to the deterministic simulation engine, reads only point-in-time data via the As-Of Gateway
(PIT-1/4), and applies institutional realism (costs/borrow/impact/capacity) by reference (BT-2, P3-16).
It is NOT production execution and has NO market connectivity.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef

from backtesting_service.context import BacktestContext


class HistoricalSimulationCoordinator(Protocol):
    """Coordinates a deterministic historical simulation over the simulated clock. Interface only.

    It prepares the run and returns the Run Manifest of the produced (reproducible) result; it runs no
    algorithm, reads no wall-clock time, and connects to no broker/market.
    """

    def prepare(self, backtest: EntityId, context: BacktestContext) -> None: ...
    def coordinate_run(self, backtest: EntityId) -> RunManifestRef: ...
