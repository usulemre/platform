"""Golden-set tests for the multi-dimensional State Reconciler (VS-1, CS-2, §6).

Each test pins one guarantee of expected-vs-reported broker-state reconciliation: the four
dimensions (positions/balances/orders/fills), every divergence class (missing/unexpected/mismatch/
duplicate), idempotency, determinism, and never-mutate-to-hide.
"""
from __future__ import annotations

import pytest
from execution_service.reconciliation import (
    BalanceState,
    DiscrepancyKind,
    FillState,
    OrderState,
    PositionState,
    ReconciliationSnapshot,
    ReconciliationSpecError,
    ReconciliationTolerance,
    StateReconciler,
)


def _snap(**kw: object) -> ReconciliationSnapshot:
    return ReconciliationSnapshot(**kw)  # type: ignore[arg-type]


def _kinds(report) -> set[DiscrepancyKind]:  # type: ignore[no-untyped-def]
    return {d.kind for d in report.discrepancies}


# --- clean ------------------------------------------------------------------


def test_identical_state_is_clean() -> None:
    snap = _snap(
        positions=(PositionState("BTC", 1.5),),
        balances=(BalanceState("USDT", 1000.0),),
        orders=(OrderState("O1", "filled", 1.0),),
        fills=(FillState("F1", "O1", 1.0, 100.0, 0.1),),
    )
    report = StateReconciler().reconcile(snap, snap)
    assert report.matched is True
    assert report.clean is True
    assert report.discrepancies == ()


# --- positions & balances ---------------------------------------------------


def test_position_quantity_mismatch() -> None:
    exp = _snap(positions=(PositionState("BTC", 1.5),))
    rep = _snap(positions=(PositionState("BTC", 1.4),))
    report = StateReconciler().reconcile(exp, rep)
    assert report.matched is False
    d = report.of_kind(DiscrepancyKind.POSITION_MISMATCH)[0]
    assert d.entity == "BTC" and d.expected == "1.5" and d.observed == "1.4"


def test_missing_position_treated_as_zero() -> None:
    """A symbol expected but not reported diverges against reported 0 (fail closed)."""
    exp = _snap(positions=(PositionState("ETH", 10.0),))
    report = StateReconciler().reconcile(exp, _snap())
    assert DiscrepancyKind.POSITION_MISMATCH in _kinds(report)


def test_balance_mismatch_and_tolerance() -> None:
    exp = _snap(balances=(BalanceState("USDT", 1000.00),))
    rep = _snap(balances=(BalanceState("USDT", 999.99),))
    assert StateReconciler().reconcile(exp, rep).matched is False
    tol = StateReconciler(ReconciliationTolerance(balance=0.02))
    assert tol.reconcile(exp, rep).matched is True


# --- orders -----------------------------------------------------------------


def test_missing_and_unexpected_orders() -> None:
    exp = _snap(orders=(OrderState("O1", "open", 1.0),))
    rep = _snap(orders=(OrderState("O2", "open", 1.0),))
    report = StateReconciler().reconcile(exp, rep)
    assert _kinds(report) == {DiscrepancyKind.ORDER_MISSING, DiscrepancyKind.ORDER_UNEXPECTED}
    assert report.of_kind(DiscrepancyKind.ORDER_MISSING)[0].entity == "O1"
    assert report.of_kind(DiscrepancyKind.ORDER_UNEXPECTED)[0].entity == "O2"


def test_order_status_and_quantity_mismatch() -> None:
    """A cancellation/rejection shows as a status mismatch; a partial fill as a quantity mismatch."""
    exp = _snap(orders=(OrderState("O1", "filled", 5.0),))
    rep = _snap(orders=(OrderState("O1", "cancelled", 3.0),))
    report = StateReconciler().reconcile(exp, rep)
    assert _kinds(report) == {
        DiscrepancyKind.ORDER_STATUS_MISMATCH,
        DiscrepancyKind.ORDER_QUANTITY_MISMATCH,
    }


# --- fills ------------------------------------------------------------------


def test_missing_and_unexpected_fills() -> None:
    exp = _snap(fills=(FillState("F1", "O1", 1.0, 100.0, 0.1),))
    rep = _snap(fills=(FillState("F2", "O1", 1.0, 100.0, 0.1),))
    report = StateReconciler().reconcile(exp, rep)
    assert _kinds(report) == {DiscrepancyKind.FILL_MISSING, DiscrepancyKind.FILL_UNEXPECTED}


def test_fill_field_mismatches() -> None:
    exp = _snap(fills=(FillState("F1", "O1", 1.0, 100.0, 0.10),))
    rep = _snap(fills=(FillState("F1", "O9", 1.5, 101.0, 0.20),))
    report = StateReconciler().reconcile(exp, rep)
    assert _kinds(report) == {
        DiscrepancyKind.FILL_ORDER_LINK_MISMATCH,
        DiscrepancyKind.FILL_QUANTITY_MISMATCH,
        DiscrepancyKind.FILL_PRICE_MISMATCH,
        DiscrepancyKind.FILL_FEE_MISMATCH,
    }


def test_fill_tolerances_absorb_rounding() -> None:
    exp = _snap(fills=(FillState("F1", "O1", 1.0, 100.000, 0.100),))
    rep = _snap(fills=(FillState("F1", "O1", 1.0, 100.001, 0.101),))
    tol = ReconciliationTolerance(price=0.01, fee=0.01)
    assert StateReconciler(tol).reconcile(exp, rep).matched is True


# --- duplicates -------------------------------------------------------------


def test_duplicate_event_detected() -> None:
    """A repeated id within one snapshot is a duplicated event; it never silently collapses."""
    rep = _snap(fills=(FillState("F1", "O1", 1.0, 100.0, 0.1), FillState("F1", "O1", 1.0, 100.0, 0.1)))
    exp = _snap(fills=(FillState("F1", "O1", 1.0, 100.0, 0.1),))
    report = StateReconciler().reconcile(exp, rep)
    assert DiscrepancyKind.DUPLICATE_EVENT in _kinds(report)


# --- idempotency / determinism / purity -------------------------------------


def test_idempotent_and_deterministic() -> None:
    exp = _snap(
        positions=(PositionState("BTC", 1.0), PositionState("ETH", 2.0)),
        orders=(OrderState("O1", "open", 1.0),),
    )
    rep = _snap(positions=(PositionState("BTC", 0.9),), orders=(OrderState("O2", "open", 1.0),))
    r = StateReconciler()
    first = r.reconcile(exp, rep)
    second = r.reconcile(exp, rep)
    assert first == second  # idempotent: same inputs -> identical report
    # deterministic total ordering by (kind, entity, field)
    keys = [d.sort_key for d in first.discrepancies]
    assert keys == sorted(keys)


def test_reconcile_does_not_mutate_inputs() -> None:
    exp = _snap(positions=(PositionState("BTC", 1.0),))
    rep = _snap(positions=(PositionState("BTC", 2.0),))
    StateReconciler().reconcile(exp, rep)
    assert exp.positions == (PositionState("BTC", 1.0),)  # unchanged
    assert rep.positions == (PositionState("BTC", 2.0),)


def test_negative_tolerance_rejected() -> None:
    with pytest.raises(ReconciliationSpecError):
        ReconciliationTolerance(quantity=-0.1)
