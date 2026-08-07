"""As-Of Data Gateway — the mandatory point-in-time read path (CP-3, PIT-1, P1-01).

This is the first *deterministic engine* in the Storage Layer (DE-1, DE-2): unlike the
surrounding interface-only modules, it contains real, golden-tested logic. It fulfils the
domain contract ``core_domain.shared.AsOfReadPort`` (CS-1: honour the contract you consume).

Guarantees enforced *by construction*, not by prose (CP-1):

* **Fail closed (PIT-1).** A historical read without an ``AsOf`` is impossible: the typed port
  forbids it, and the runtime guard raises ``PointInTimeViolation`` if one is passed dynamically.
* **No look-ahead (CP-3, PIT-3).** A read never returns a record whose ``knowledge_time`` is later
  than the ``as_of`` boundary. Information not yet known at the decision moment cannot leak.
* **Correct restatement (DI-3).** When a fact is restated (a newer ``knowledge_time`` for the same
  ``event_time``), an as-of read before the restatement still returns the *old* value; a read after
  it returns the *new* one. Vintages are superseded, never mutated (CP-2).
* **Append-only (CP-2).** Records are added, never overwritten in place.
* **Deterministic (DE-2, CS-3).** Given the same store state and ``as_of``, the result is identical.
  No wall-clock, randomness, or I/O is read here; time is supplied via the bitemporal stamps.

Ordering uses the ISO-8601 string form of the timestamps, which sorts chronologically for
zero-padded UTC instants — keeping the engine library-free (no ``datetime`` parsing).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

from core_domain.shared import (
    AsOf,
    BitemporalStamp,
    EntityId,
    NotFound,
    PointInTimeViolation,
)

TAgg = TypeVar("TAgg")


@dataclass(frozen=True, slots=True)
class BitemporalRecord(Generic[TAgg]):
    """One immutable vintage of a value for an entity (CP-2).

    ``stamp`` carries both when the fact was true (``event_time``) and when the platform learned it
    (``knowledge_time``). A later ``knowledge_time`` for the same entity is a *restatement* (DI-3).
    """

    entity_id: EntityId
    value: TAgg
    stamp: BitemporalStamp


def _knowledge_key(stamp: BitemporalStamp) -> str:
    return stamp.knowledge_time.at.iso8601


def _event_key(stamp: BitemporalStamp) -> str:
    return stamp.event_time.at.iso8601


class InMemoryAsOfGateway(Generic[TAgg]):
    """Deterministic, append-only, in-memory As-Of read gateway.

    Implements ``core_domain.shared.AsOfReadPort[TAgg]``. Storage-vendor-neutral (no database): the
    point-in-time *semantics* live here; a production adapter can back the same semantics with a
    real bitemporal store without changing consumers (SE-3, replaceability).
    """

    __slots__ = ("_by_entity",)

    def __init__(self) -> None:
        # Insertion order is preserved, giving stable, deterministic tie-breaking.
        self._by_entity: dict[str, list[BitemporalRecord[TAgg]]] = {}

    # ---- write side (append-only, CP-2) -------------------------------------------------

    def append(self, record: BitemporalRecord[TAgg]) -> None:
        """Append an immutable vintage. Never mutates or removes an existing record (CP-2)."""
        self._by_entity.setdefault(record.entity_id.value, []).append(record)

    # ---- read side (AsOfReadPort) -------------------------------------------------------

    def read_as_of(self, id: EntityId, as_of: AsOf) -> TAgg:
        """Return the value for ``id`` as it was known at ``as_of`` (CP-3, PIT-1).

        Raises ``PointInTimeViolation`` if ``as_of`` is missing (fail closed, PIT-1) and
        ``NotFound`` if nothing was known about ``id`` at that boundary.
        """
        # Fail-closed guard: the type says AsOf is required, but defend against dynamic callers.
        if as_of is None:  # type: ignore[redundant-expr]
            raise PointInTimeViolation(
                "as-of read requires an explicit AsOf boundary (PIT-1); refusing to read"
            )

        boundary = as_of.knowledge_time.at.iso8601
        candidates = [
            r
            for r in self._by_entity.get(id.value, ())
            # No look-ahead: exclude anything the platform did not yet know at the boundary (CP-3).
            if _knowledge_key(r.stamp) <= boundary
        ]
        if not candidates:
            raise NotFound(f"no vintage of {id.value!r} was known as of {boundary}")

        # Latest restatement known by the boundary wins (DI-3): max knowledge_time, then max
        # event_time, then latest appended (insertion order) — fully deterministic.
        best = candidates[0]
        for r in candidates[1:]:
            rk, bk = _knowledge_key(r.stamp), _knowledge_key(best.stamp)
            if rk > bk or (rk == bk and _event_key(r.stamp) >= _event_key(best.stamp)):
                best = r
        return best.value


__all__ = ["BitemporalRecord", "InMemoryAsOfGateway"]
