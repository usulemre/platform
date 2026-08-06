"""Backtest Repository Interfaces — append-only, immutable repositories (no persistence).

Backtest results are immutable, reproducible artifacts (BT-3); they are append-only and never edited
(BT-4). No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from backtesting_service.model import Backtest
from backtesting_service.result_management import BacktestResult
from backtesting_service.session import BacktestSession


class BacktestRepositoryContract(Protocol):
    """Append-only repository of backtests (immutable; supersede, never mutate, CP-2)."""

    def get(self, backtest: EntityId) -> Backtest: ...
    def add(self, backtest: Backtest) -> None: ...


class BacktestResultRepository(Protocol):
    """Append-only repository of immutable, reproducible results (never edited, BT-3/4)."""

    def get(self, backtest: EntityId) -> BacktestResult: ...
    def add(self, result: BacktestResult) -> None: ...


class BacktestSessionRepository(Protocol):
    """Append-only repository of run sessions. Interface only."""

    def get(self, session: EntityId) -> BacktestSession: ...
    def add(self, session: BacktestSession) -> None: ...
