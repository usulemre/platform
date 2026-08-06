"""Backtest Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from backtesting_service.lifecycle import BacktestLifecycle


@dataclass(frozen=True, slots=True)
class BacktestStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: BacktestLifecycle
    since: str
