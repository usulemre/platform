"""Backtest Session — an immutable record of a backtest run session (binds run inputs to a manifest)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef

from backtesting_service.context import BacktestContext
from backtesting_service.scenario import BacktestScenario


@dataclass(frozen=True, slots=True)
class BacktestSession:
    """An immutable record binding a backtest + scenario + context to a Run Manifest (reproducibility)."""

    backtest_id: EntityId
    scenario: str
    manifest: RunManifestRef


class BacktestSessionService(Protocol):
    """Opens/closes a deterministic backtest run session. Interface only — no execution here."""

    def open_session(
        self, backtest: EntityId, scenario: BacktestScenario, context: BacktestContext
    ) -> BacktestSession: ...
    def close_session(self, session: EntityId) -> None: ...
