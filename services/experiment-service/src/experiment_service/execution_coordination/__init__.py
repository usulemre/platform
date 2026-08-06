"""Experiment Execution Coordination — delegates execution to the deterministic engines (no backtests).

It prepares runs, enrolls trials in the Trial Ledger BEFORE they run (every trial counted, EX-4,
P2-01), and records completion. It does NOT execute backtests or run statistics (RB-11, RB-01).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExperimentExecutionCoordinator(Protocol):
    """Coordinates experiment execution by delegating to the Backtesting/Quant engines. Interface only.

    ``record_trial`` enrolls a trial in the Trial Ledger before it runs (EX-4); the coordinator never
    runs the trial itself and never observes validation/OOS outcomes (AD-3, P2-07).
    """

    def prepare_run(self, experiment: EntityId) -> None: ...
    def record_trial(self, experiment: EntityId) -> None: ...
    def mark_completed(self, experiment: EntityId) -> None: ...
