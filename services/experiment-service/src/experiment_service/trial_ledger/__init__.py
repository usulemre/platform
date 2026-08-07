"""Trial Ledger — the append-only, tamper-evident record of every trial (P2-01, SI-1, SEC-4).

The second deterministic engine in the platform (after the As-Of Gateway). It fulfils the domain
contract ``core_domain.experiment.TrialLedger`` (CS-1) and adds the tamper-evidence the contract's
docstring promises but an interface cannot enforce (CP-1: enforcement over intention).

Guarantees, enforced by construction:

* **Append-only (CP-2, EX-3).** Entries are only appended; an existing entry is never mutated or
  removed. Re-enrolling the same trial id is a ``Conflict``.
* **Every trial counted (EX-4, SI-1).** RUN, DISCARDED and FAILED trials all enter the ledger, so
  the multiple-testing budget (P2-02) accounts for the true number of trials — defeating AP-2
  (a global counter masquerading as control) by making the count auditable and complete.
* **Tamper-evident (SEC-4).** Each entry is hash-chained to its predecessor:
  ``entry_hash = SHA-256(seq | trial_id | experiment_id | outcome | prev_hash)``. Altering any past
  entry (or reordering entries) breaks the chain, which ``verify`` detects.
* **Deterministic (DE-2).** The same sequence of appends yields the same chain and head hash. No
  wall-clock, randomness, or I/O is read here (CS-3).

Enrolment happens *before* a trial runs (SM-5): the ledger records intent, not results, so it can
never be back-filled to hide unfavourable trials (FB-8, p-hacking).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

from core_domain.experiment import Trial, TrialOutcome
from core_domain.shared import Conflict, EntityId, NotFound

from experiment_service.errors import ExperimentError

#: The chain root. A fixed, zeroed digest so the first entry's linkage is well-defined.
GENESIS_HASH = "0" * 64

_FIELD_SEP = "\x1f"  # unit separator — cannot occur in ids/outcomes, so canonical form is unambiguous


class LedgerIntegrityError(ExperimentError):
    """The Trial Ledger's hash chain does not verify — the ledger has been tampered with (SEC-4)."""


@dataclass(frozen=True, slots=True)
class TrialLedgerEntry:
    """One immutable, hash-chained ledger entry (CP-2). Pure data — safe to export and re-verify."""

    seq: int
    trial_id: str
    experiment_id: str
    outcome: str  # a ``TrialOutcome`` value
    prev_hash: str
    entry_hash: str


def _digest(seq: int, trial_id: str, experiment_id: str, outcome: str, prev_hash: str) -> str:
    payload = _FIELD_SEP.join((str(seq), trial_id, experiment_id, outcome, prev_hash))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def verify_entries(entries: tuple[TrialLedgerEntry, ...], genesis: str = GENESIS_HASH) -> bool:
    """Recompute the chain and confirm every entry's linkage and hash (SEC-4). Pure function."""
    prev = genesis
    for i, e in enumerate(entries):
        if e.seq != i or e.prev_hash != prev:
            return False
        if e.entry_hash != _digest(e.seq, e.trial_id, e.experiment_id, e.outcome, e.prev_hash):
            return False
        prev = e.entry_hash
    return True


class HashChainedTrialLedger:
    """Concrete, in-memory ``core_domain.experiment.TrialLedger`` with a tamper-evident hash chain.

    Storage-vendor-neutral: the tamper-evidence *semantics* live here; a production adapter can
    persist the same entries to a WORM store without changing consumers (SE-3).
    """

    __slots__ = ("_entries", "_by_id", "_genesis")

    def __init__(self, genesis: str = GENESIS_HASH) -> None:
        self._entries: list[TrialLedgerEntry] = []
        self._by_id: dict[str, Trial] = {}
        self._genesis = genesis

    # ---- TrialLedger contract -----------------------------------------------------------

    def append(self, trial: Trial) -> None:
        """Enrol a trial before it runs (SM-5, P2-01). Appends one hash-chained entry (CP-2)."""
        tid = trial.id.value
        if tid in self._by_id:
            raise Conflict(f"trial {tid!r} is already enrolled in the ledger (append-only, CP-2)")
        seq = len(self._entries)
        prev = self.head_hash
        entry_hash = _digest(seq, tid, trial.experiment.value, trial.outcome.value, prev)
        self._entries.append(
            TrialLedgerEntry(
                seq=seq,
                trial_id=tid,
                experiment_id=trial.experiment.value,
                outcome=trial.outcome.value,
                prev_hash=prev,
                entry_hash=entry_hash,
            )
        )
        self._by_id[tid] = trial

    def get(self, id: EntityId) -> Trial:
        try:
            return self._by_id[id.value]
        except KeyError:
            raise NotFound(f"trial {id.value!r} is not in the ledger") from None

    # ---- tamper-evidence + accounting ---------------------------------------------------

    @property
    def head_hash(self) -> str:
        """The current chain head; ``genesis`` when the ledger is empty."""
        return self._entries[-1].entry_hash if self._entries else self._genesis

    @property
    def entries(self) -> tuple[TrialLedgerEntry, ...]:
        """An immutable snapshot of the chain (safe to hand to ``verify_entries``)."""
        return tuple(self._entries)

    def verify(self) -> None:
        """Raise ``LedgerIntegrityError`` if the stored chain does not verify (SEC-4)."""
        if not verify_entries(self.entries, self._genesis):
            raise LedgerIntegrityError("trial ledger hash chain failed verification (tampering)")

    def total(self) -> int:
        """Total trials enrolled — the honest denominator for multiple-testing control (EX-4)."""
        return len(self._entries)

    def count(self, outcome: TrialOutcome) -> int:
        """Number of enrolled trials with the given outcome (all outcomes are counted, EX-4)."""
        return sum(1 for e in self._entries if e.outcome == outcome.value)


__all__ = [
    "GENESIS_HASH",
    "HashChainedTrialLedger",
    "LedgerIntegrityError",
    "TrialLedgerEntry",
    "verify_entries",
]
