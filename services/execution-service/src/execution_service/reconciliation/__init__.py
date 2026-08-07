"""Reconciliation — the position ledger and multi-dimensional broker-state reconciliation (OB-1).

Two complementary deterministic reconcilers:

* ``PositionReconciler`` (``ledger``) — the append-only fill ledger and its coarse net-position check.
* ``StateReconciler`` (``state``) — expected-vs-reported reconciliation across positions, balances,
  orders and fills, emitting explicit idempotent ``Discrepancy`` records.
"""
from __future__ import annotations

from execution_service.reconciliation.ledger import (
    PositionReconciler,
    ReconciliationError,
    ReconciliationResult,
)
from execution_service.reconciliation.state import (
    BalanceState,
    Discrepancy,
    DiscrepancyKind,
    FillState,
    OrderState,
    PositionState,
    ReconciliationReport,
    ReconciliationSnapshot,
    ReconciliationSpecError,
    ReconciliationTolerance,
    StateReconciler,
)

__all__ = [
    # ledger
    "PositionReconciler",
    "ReconciliationError",
    "ReconciliationResult",
    # state
    "BalanceState",
    "Discrepancy",
    "DiscrepancyKind",
    "FillState",
    "OrderState",
    "PositionState",
    "ReconciliationReport",
    "ReconciliationSnapshot",
    "ReconciliationSpecError",
    "ReconciliationTolerance",
    "StateReconciler",
]
