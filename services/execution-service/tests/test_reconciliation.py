"""Golden-set tests for the Position Reconciliation ledger (VS-1, CS-2, CP-2)."""
from __future__ import annotations

import pytest
from core_domain.execution import Fill
from execution_service.reconciliation import (
    PositionReconciler,
    ReconciliationError,
    ReconciliationResult,
)


def test_empty_ledger_is_flat() -> None:
    rec = PositionReconciler()
    assert rec.net_quantity == 0.0
    assert rec.fills == ()


def test_net_position_is_sum_of_signed_fills() -> None:
    rec = PositionReconciler()
    rec.record(Fill(quantity=100.0, price=10.0))
    rec.record(Fill(quantity=-40.0, price=11.0))  # sell
    assert rec.net_quantity == 60.0
    assert len(rec.fills) == 2


def test_reconcile_matches_when_books_agree() -> None:
    rec = PositionReconciler()
    rec.record(Fill(quantity=100.0, price=10.0))
    result = rec.reconcile(reported_quantity=100.0)
    assert isinstance(result, ReconciliationResult)
    assert result.matched is True
    assert result.difference == 0.0


def test_reconcile_flags_divergence() -> None:
    """Fail closed: a gap beyond tolerance is an unreconciled discrepancy."""
    rec = PositionReconciler()
    rec.record(Fill(quantity=100.0, price=10.0))
    result = rec.reconcile(reported_quantity=95.0)
    assert result.matched is False
    assert result.difference == 5.0
    assert result.internal_quantity == 100.0
    assert result.reported_quantity == 95.0


def test_tolerance_absorbs_rounding() -> None:
    rec = PositionReconciler()
    rec.record(Fill(quantity=100.0, price=10.0))
    assert rec.reconcile(reported_quantity=99.999, tolerance=0.01).matched is True


def test_negative_tolerance_rejected() -> None:
    rec = PositionReconciler()
    with pytest.raises(ReconciliationError):
        rec.reconcile(reported_quantity=0.0, tolerance=-1.0)


def test_fills_snapshot_is_immutable() -> None:
    rec = PositionReconciler()
    rec.record(Fill(quantity=1.0, price=1.0))
    snapshot = rec.fills
    rec.record(Fill(quantity=1.0, price=1.0))
    assert len(snapshot) == 1  # earlier snapshot unaffected (immutable tuple)
    assert len(rec.fills) == 2


def test_deterministic_reconciliation() -> None:
    def build() -> PositionReconciler:
        r = PositionReconciler()
        r.record(Fill(quantity=100.0, price=10.0))
        r.record(Fill(quantity=-30.0, price=10.5))
        return r

    assert build().reconcile(70.0) == build().reconcile(70.0)
