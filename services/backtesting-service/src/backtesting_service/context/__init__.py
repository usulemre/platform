"""Execution Context — the immutable, deterministic execution context (simulated clock)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AsOf


@dataclass(frozen=True, slots=True)
class BacktestContext:
    """Immutable execution context for a backtest run.

    Time is SIMULATED via the injected clock (``as_of``); reading wall-clock time during simulation is
    PROHIBITED (PIT-4, BT-1). The RNG ``seed_ref`` and ``hardware_class`` are recorded in the Run
    Manifest for reproducibility (P1-02); no ambient non-determinism.
    """

    as_of: AsOf
    seed_ref: str
    hardware_class: str
