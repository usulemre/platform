"""Execution Reporting — the execution report model and reporting INTERFACE (references, not stats)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref

from execution_service.model import ExecutionSummary


@dataclass(frozen=True, slots=True)
class ExecutionReport:
    """An immutable, explainable execution report (references deterministic outputs, EXP-2)."""

    execution_id: EntityId
    summary: ExecutionSummary
    tca_ref: Ref          # realized transaction-cost analysis (computed by the deterministic engine)
    parity_ref: Ref
    reconciliation_ref: Ref


class ExecutionReportingService(Protocol):
    """Generates an immutable, explainable execution report. Interface only — no computation."""

    def generate(self, execution: EntityId) -> ExecutionReport: ...
