"""Performance Reporting — the performance report model and reporting INTERFACE (references, not stats).

Metrics are DEFLATED and computed by the deterministic Statistics engine (SI-3); this model holds
references/attribution/capacity, NOT the calculations. No statistics here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref, RunManifestRef


@dataclass(frozen=True, slots=True)
class ExecutionSummary:
    """A summary of the simulated execution (references, not computed statistics)."""

    trade_count: int
    fills_ref: Ref
    turnover_ref: Ref


@dataclass(frozen=True, slots=True)
class PerformanceReport:
    """An immutable performance report referencing deterministic outputs by manifest.

    Metrics are deflated by the deterministic Statistics engine (SI-3); attribution and capacity are
    referenced (BT-3). Presenting undeflated performance as evidence is PROHIBITED (SI-3).
    """

    backtest_id: EntityId
    result_manifest: RunManifestRef
    metrics_ref: Ref       # -> deterministic, deflated metrics artifact
    attribution_ref: Ref
    capacity_ref: Ref
    execution: ExecutionSummary


class PerformanceReportingService(Protocol):
    """Generates an immutable performance report from a completed backtest. Interface only."""

    def generate(self, backtest: EntityId) -> PerformanceReport: ...
