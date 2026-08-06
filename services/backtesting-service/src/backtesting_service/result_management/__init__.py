"""Result Management — the immutable backtest result model and management INTERFACE (no manual edits)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref, RunManifestRef


@dataclass(frozen=True, slots=True)
class BacktestResult:
    """An immutable, reproducible backtest result artifact (BT-3).

    It references the deterministic outputs by manifest; a result is NEVER manually edited (BT-4).
    """

    backtest_id: EntityId
    manifest: RunManifestRef
    performance: Ref   # -> performance report artifact
    reproducible: bool


class BacktestResultService(Protocol):
    """Records and retrieves immutable results. Interface only.

    A result MUST NOT be manually manipulated to improve it (BT-4); results are append-only.
    """

    def record(self, result: BacktestResult) -> None: ...
    def get(self, backtest: EntityId) -> BacktestResult: ...
