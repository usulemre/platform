"""Backtest Configuration — the immutable, reproducibility-bearing configuration (data + interface).

Institutional realism (net-of-cost, borrow/availability, participation-aware impact, corporate
actions, capacity) is declared by reference/parameter; the deterministic engine applies it (BT-2,
P3-16). No algorithm here. Changing the configuration creates a new backtest version.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class CostModelReference:
    """Reference to the net-of-cost model applied by the deterministic engine (BT-2, AD-1)."""

    model: Ref


@dataclass(frozen=True, slots=True)
class BacktestConfiguration:
    """An immutable backtest configuration bound into the run manifest for reproducibility (RP-1).

    ``feature_refs`` reference features (Feature Service, canonical source); ``universe_ref`` is a
    survivorship-safe, as-of universe (PIT-2). ``parameters`` are non-secret label pairs (SEC-3).
    """

    config_hash: str
    feature_refs: tuple[Ref, ...]
    universe_ref: Ref
    horizon: str
    cost_model: CostModelReference
    parameters: tuple[tuple[str, str], ...]


class BacktestConfigurationService(Protocol):
    """Configures a backtest (immutable once set). Interface only."""

    def configure(self, backtest: EntityId, configuration: BacktestConfiguration) -> None: ...
