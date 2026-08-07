"""Position-ledger reconciliation — the append-only fill ledger and its net-position check (CP-2, OB-1).

Every fill is recorded to an append-only position ledger; ``reconcile`` compares the platform's
internally-derived *net* position against an externally reported position and reports whether they
agree within a tolerance. This is the coarse single-instrument check; the multi-dimensional
expected-vs-reported reconciliation lives in ``execution_service.reconciliation.state``.

Enforced by construction:

* **Append-only (CP-2).** Fills are only appended; the net position is derived, never edited. The
  recorded fills are exposed only as an immutable snapshot.
* **Reality is supplied, never read (CS-3).** ``reconcile`` takes the externally-reported position
  as an argument; the ledger performs no I/O and reads no wall-clock, so a reconciliation is exactly
  reproducible (DE-2).
* **Fails closed on divergence.** ``matched`` is true only when ``|internal - reported|`` is within
  the tolerance; any larger gap is an unreconciled discrepancy that downstream governance must act on.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.execution import Fill

from execution_service.errors import ExecutionError


class ReconciliationError(ExecutionError):
    """A reconciliation was requested with an invalid (negative) tolerance."""


@dataclass(frozen=True, slots=True)
class ReconciliationResult:
    """The immutable outcome of a net-position reconciliation (EXP-2)."""

    matched: bool
    internal_quantity: float
    reported_quantity: float
    difference: float  # internal - reported


class PositionReconciler:
    """An append-only position ledger with deterministic net-position reconciliation.

    Fill quantities are signed (buys positive, sells negative); the net position is their sum.
    """

    __slots__ = ("_fills", "_net")

    def __init__(self) -> None:
        self._fills: list[Fill] = []
        self._net = 0.0

    def record(self, fill: Fill) -> None:
        """Append a fill (CP-2) and update the derived net position."""
        self._fills.append(fill)
        self._net += fill.quantity

    @property
    def net_quantity(self) -> float:
        """The internally-derived net position — the sum of recorded fill quantities."""
        return self._net

    @property
    def fills(self) -> tuple[Fill, ...]:
        """An immutable snapshot of the recorded fills."""
        return tuple(self._fills)

    def reconcile(self, reported_quantity: float, tolerance: float = 0.0) -> ReconciliationResult:
        """Compare the internal net position against a supplied reported position (CS-3)."""
        if tolerance < 0.0:
            raise ReconciliationError(f"tolerance must be >= 0; got {tolerance!r}")
        difference = self._net - reported_quantity
        return ReconciliationResult(
            matched=abs(difference) <= tolerance,
            internal_quantity=self._net,
            reported_quantity=reported_quantity,
            difference=difference,
        )


__all__ = ["PositionReconciler", "ReconciliationError", "ReconciliationResult"]
