"""State Reconciliation — expected-vs-reported broker/exchange state as explicit discrepancies.

Extends the coarse net-position ledger (``ledger.py``) to the full operational picture the
architecture mandates: an "authoritative position/cash ledger and daily reconciliation with brokers"
(ARCH §2.9; architecture_v2 §Execution). It compares the platform's *expected* state against the
*reported* broker/exchange state across four dimensions — positions, balances, orders, fills — and
turns every divergence into an explicit, machine-readable ``Discrepancy`` record.

Enforced by construction:

* **Never mutates expected state (§6).** ``reconcile`` is a pure function of ``(expected, reported)``;
  it hides no divergence and repairs nothing. A gap becomes a discrepancy, never a silent edit.
* **Idempotent & deterministic (DE-2, CS-3).** Same snapshots ⇒ byte-identical report. Discrepancies
  are emitted in a total, stable order (kind, entity, field); no wall-clock, randomness or I/O.
* **Fails closed.** ``matched`` is true only when there are *zero* discrepancies; a missing order, an
  unexpected fill, a duplicated event, or a quantity/price/fee gap beyond tolerance all block it.
* **Every event class covered.** Missing (expected∖reported), unexpected (reported∖expected),
  mismatched (present in both, differing beyond tolerance), and duplicated (repeated id within one
  snapshot) — for orders and fills; position/balance quantity gaps; order-status divergence.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from enum import Enum
from typing import TypeVar

from execution_service.errors import ExecutionError


class ReconciliationSpecError(ExecutionError):
    """The reconciliation tolerance is invalid (a negative tolerance)."""


class DiscrepancyKind(Enum):
    """Every way expected and reported state can diverge (§6)."""

    POSITION_MISMATCH = "position_mismatch"
    BALANCE_MISMATCH = "balance_mismatch"
    ORDER_MISSING = "order_missing"  # expected an order the broker does not report
    ORDER_UNEXPECTED = "order_unexpected"  # broker reports an order we did not expect
    ORDER_STATUS_MISMATCH = "order_status_mismatch"
    ORDER_QUANTITY_MISMATCH = "order_quantity_mismatch"
    FILL_MISSING = "fill_missing"
    FILL_UNEXPECTED = "fill_unexpected"
    FILL_QUANTITY_MISMATCH = "fill_quantity_mismatch"
    FILL_PRICE_MISMATCH = "fill_price_mismatch"
    FILL_FEE_MISMATCH = "fill_fee_mismatch"
    FILL_ORDER_LINK_MISMATCH = "fill_order_link_mismatch"
    DUPLICATE_EVENT = "duplicate_event"  # the same id appears twice within one snapshot


# --- snapshot value objects (reconciliation inputs) ------------------------


@dataclass(frozen=True, slots=True)
class PositionState:
    symbol: str
    quantity: float  # signed


@dataclass(frozen=True, slots=True)
class BalanceState:
    asset: str
    amount: float


@dataclass(frozen=True, slots=True)
class OrderState:
    order_id: str
    status: str
    quantity: float


@dataclass(frozen=True, slots=True)
class FillState:
    fill_id: str
    order_id: str
    quantity: float
    price: float
    fee: float


@dataclass(frozen=True, slots=True)
class ReconciliationSnapshot:
    """One side of a reconciliation (either the internal books or the reported broker state)."""

    positions: tuple[PositionState, ...] = ()
    balances: tuple[BalanceState, ...] = ()
    orders: tuple[OrderState, ...] = ()
    fills: tuple[FillState, ...] = ()


@dataclass(frozen=True, slots=True)
class ReconciliationTolerance:
    """Per-field absolute tolerances; a gap within tolerance is not a discrepancy."""

    quantity: float = 0.0
    price: float = 0.0
    fee: float = 0.0
    balance: float = 0.0

    def __post_init__(self) -> None:
        for name in ("quantity", "price", "fee", "balance"):
            if getattr(self, name) < 0.0:
                raise ReconciliationSpecError(f"{name} tolerance must be >= 0")


# --- output ----------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Discrepancy:
    """One explicit divergence between expected and reported state (EXP-2, OB-1)."""

    kind: DiscrepancyKind
    entity: str  # symbol / order_id / fill_id
    field: str  # "quantity" / "status" / "price" / "fee" / "amount" / "presence" / "order_id"
    expected: str
    observed: str

    @property
    def sort_key(self) -> tuple[str, str, str]:
        return (self.kind.value, self.entity, self.field)


@dataclass(frozen=True, slots=True)
class ReconciliationReport:
    """The immutable, deterministic outcome of a state reconciliation."""

    matched: bool
    discrepancies: tuple[Discrepancy, ...]

    @property
    def clean(self) -> bool:
        return self.matched

    def of_kind(self, kind: DiscrepancyKind) -> tuple[Discrepancy, ...]:
        return tuple(d for d in self.discrepancies if d.kind is kind)


_T = TypeVar("_T")


class StateReconciler:
    """The deterministic expected-vs-reported broker-state reconciler."""

    __slots__ = ("_tol",)

    def __init__(self, tolerance: ReconciliationTolerance | None = None) -> None:
        self._tol = tolerance or ReconciliationTolerance()

    def reconcile(
        self, expected: ReconciliationSnapshot, reported: ReconciliationSnapshot
    ) -> ReconciliationReport:
        found: list[Discrepancy] = []
        self._positions(expected, reported, found)
        self._balances(expected, reported, found)
        self._orders(expected, reported, found)
        self._fills(expected, reported, found)
        ordered = tuple(sorted(found, key=lambda d: d.sort_key))
        return ReconciliationReport(matched=not ordered, discrepancies=ordered)

    # ---- dimensions ---------------------------------------------------------

    def _positions(
        self, exp: ReconciliationSnapshot, rep: ReconciliationSnapshot, out: list[Discrepancy]
    ) -> None:
        e = self._index(exp.positions, lambda p: p.symbol, out)
        r = self._index(rep.positions, lambda p: p.symbol, out)
        for symbol in e.keys() | r.keys():
            eq = e[symbol].quantity if symbol in e else 0.0
            rq = r[symbol].quantity if symbol in r else 0.0
            if abs(eq - rq) > self._tol.quantity:
                out.append(
                    Discrepancy(DiscrepancyKind.POSITION_MISMATCH, symbol, "quantity", str(eq), str(rq))
                )

    def _balances(
        self, exp: ReconciliationSnapshot, rep: ReconciliationSnapshot, out: list[Discrepancy]
    ) -> None:
        e = self._index(exp.balances, lambda b: b.asset, out)
        r = self._index(rep.balances, lambda b: b.asset, out)
        for asset in e.keys() | r.keys():
            ea = e[asset].amount if asset in e else 0.0
            ra = r[asset].amount if asset in r else 0.0
            if abs(ea - ra) > self._tol.balance:
                out.append(
                    Discrepancy(DiscrepancyKind.BALANCE_MISMATCH, asset, "amount", str(ea), str(ra))
                )

    def _orders(
        self, exp: ReconciliationSnapshot, rep: ReconciliationSnapshot, out: list[Discrepancy]
    ) -> None:
        e = self._index(exp.orders, lambda o: o.order_id, out)
        r = self._index(rep.orders, lambda o: o.order_id, out)
        for oid in e.keys() - r.keys():
            out.append(Discrepancy(DiscrepancyKind.ORDER_MISSING, oid, "presence", "present", "absent"))
        for oid in r.keys() - e.keys():
            out.append(
                Discrepancy(DiscrepancyKind.ORDER_UNEXPECTED, oid, "presence", "absent", "present")
            )
        for oid in e.keys() & r.keys():
            eo, ro = e[oid], r[oid]
            if eo.status != ro.status:
                out.append(
                    Discrepancy(DiscrepancyKind.ORDER_STATUS_MISMATCH, oid, "status", eo.status, ro.status)
                )
            if abs(eo.quantity - ro.quantity) > self._tol.quantity:
                out.append(
                    Discrepancy(
                        DiscrepancyKind.ORDER_QUANTITY_MISMATCH,
                        oid,
                        "quantity",
                        str(eo.quantity),
                        str(ro.quantity),
                    )
                )

    def _fills(
        self, exp: ReconciliationSnapshot, rep: ReconciliationSnapshot, out: list[Discrepancy]
    ) -> None:
        e = self._index(exp.fills, lambda f: f.fill_id, out)
        r = self._index(rep.fills, lambda f: f.fill_id, out)
        for fid in e.keys() - r.keys():
            out.append(Discrepancy(DiscrepancyKind.FILL_MISSING, fid, "presence", "present", "absent"))
        for fid in r.keys() - e.keys():
            out.append(
                Discrepancy(DiscrepancyKind.FILL_UNEXPECTED, fid, "presence", "absent", "present")
            )
        for fid in e.keys() & r.keys():
            ef, rf = e[fid], r[fid]
            if ef.order_id != rf.order_id:
                out.append(
                    Discrepancy(
                        DiscrepancyKind.FILL_ORDER_LINK_MISMATCH, fid, "order_id", ef.order_id, rf.order_id
                    )
                )
            if abs(ef.quantity - rf.quantity) > self._tol.quantity:
                out.append(
                    Discrepancy(
                        DiscrepancyKind.FILL_QUANTITY_MISMATCH, fid, "quantity", str(ef.quantity), str(rf.quantity)
                    )
                )
            if abs(ef.price - rf.price) > self._tol.price:
                out.append(
                    Discrepancy(
                        DiscrepancyKind.FILL_PRICE_MISMATCH, fid, "price", str(ef.price), str(rf.price)
                    )
                )
            if abs(ef.fee - rf.fee) > self._tol.fee:
                out.append(
                    Discrepancy(DiscrepancyKind.FILL_FEE_MISMATCH, fid, "fee", str(ef.fee), str(rf.fee))
                )

    @staticmethod
    def _index(
        items: Iterable[_T], key: Callable[[_T], str], out: list[Discrepancy]
    ) -> dict[str, _T]:
        """Index items by id; a repeated id within one snapshot is a duplicated event (§6).

        The first occurrence wins for comparison; each subsequent repeat is recorded as a
        ``DUPLICATE_EVENT`` discrepancy so duplicates never silently collapse.
        """
        indexed: dict[str, _T] = {}
        for item in items:
            k = key(item)
            if k in indexed:
                out.append(
                    Discrepancy(DiscrepancyKind.DUPLICATE_EVENT, k, "presence", "1", "2+")
                )
                continue
            indexed[k] = item
        return indexed


__all__ = [
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
