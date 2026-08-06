"""Backtest Specifications — composable STRUCTURAL predicates over backtests (no statistics).

These check structural readiness/reproducibility/realism prerequisites, NOT statistical significance
or promotion — those are the deterministic Statistics/Validation engines' decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TBacktest = TypeVar("TBacktest", contravariant=True)


class BacktestSpecification(Protocol[TBacktest]):
    """A composable, deterministic structural predicate over a backtest. Interface only."""

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...


class ReadyToRunSpecification(Protocol[TBacktest]):
    """Structural readiness to run (configured, context has as-of + seed, survivorship-safe universe).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...


class ReproducibleSpecification(Protocol[TBacktest]):
    """Structural reproducibility check (has an immutable manifest + config hash, RP-1). Interface only."""

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...


class InstitutionalRealismSpecification(Protocol[TBacktest]):
    """Structural realism check (net-of-cost, borrow, participation-aware impact, capacity referenced).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...
