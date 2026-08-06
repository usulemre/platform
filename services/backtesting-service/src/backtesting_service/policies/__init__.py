"""Backtest Policies — deterministic policy INTERFACES governing backtests (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class BacktestPolicy(Protocol):
    """Marker for a deterministic, versioned backtest policy."""

    ...


class PointInTimePolicy(Protocol):
    """The backtest runs on the simulated clock; wall-clock reads are PROHIBITED (PIT-4, BT-1). Interface only."""

    def uses_simulated_clock(self, backtest: EntityId) -> bool: ...


class ReproducibilityPolicy(Protocol):
    """No backtest result without a captured manifest ('no optimization without reproducibility', RP-2). Interface only."""

    def has_manifest(self, backtest: EntityId) -> bool: ...


class NetOfCostPolicy(Protocol):
    """Performance is net of realistic costs; gross performance is PROHIBITED (BT-2, AD-1). Interface only."""

    def is_net_of_cost(self, backtest: EntityId) -> bool: ...


class NoManualEditPolicy(Protocol):
    """A backtest result is never manually edited to improve it (BT-4). Interface only."""

    def is_unedited(self, backtest: EntityId) -> bool: ...


class NoProductionExecutionPolicy(Protocol):
    """A backtest never performs production execution or connects to a broker/market. Interface only."""

    def is_simulation_only(self, backtest: EntityId) -> bool: ...
