"""Backtest Errors — Backtesting Engine domain errors (each expresses a violated backtesting invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class BacktestError(DomainError):
    """Base for Backtesting Engine errors."""


class NonPointInTimeRead(BacktestError):
    """The simulation read wall-clock time or future-leaking data (PIT-4, BT-1, FB-7)."""


class IrreproducibleBacktest(BacktestError):
    """A backtest result lacks a manifest or cannot be reproduced bit-for-bit (RP-2, EX-2)."""


class ManualResultEdit(BacktestError):
    """A backtest result was manually edited to improve it (BT-4, FB-9)."""


class ProductionExecutionAttempt(BacktestError):
    """The engine attempted production execution or broker/market connectivity (out of scope)."""


class GrossPerformanceReported(BacktestError):
    """Performance was reported gross of realistic costs (BT-2, AD-1)."""


class UndeflatedPerformanceReported(BacktestError):
    """Undeflated performance was presented as evidence of discovery (SI-3)."""


class MissingCapacityAssessment(BacktestError):
    """A result lacks the required capacity assessment (BT-3, AD-4)."""


class IllegalBacktestTransition(BacktestError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
