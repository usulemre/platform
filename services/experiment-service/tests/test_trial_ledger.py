"""Golden-set tests for the Trial Ledger (VS-1, CS-2).

Each test pins one constitutional guarantee of the append-only, tamper-evident ledger (P2-01,
EX-4, SEC-4).
"""
from __future__ import annotations

import dataclasses

import pytest
from core_domain.experiment import Trial, TrialOutcome
from core_domain.shared import Conflict, EntityId, NotFound
from experiment_service.trial_ledger import (
    GENESIS_HASH,
    HashChainedTrialLedger,
    LedgerIntegrityError,
    verify_entries,
)


def _trial(tid: str, exp: str, outcome: TrialOutcome) -> Trial:
    return Trial(id=EntityId(tid), experiment=EntityId(exp), outcome=outcome)


def test_empty_ledger_head_is_genesis() -> None:
    ledger = HashChainedTrialLedger()
    assert ledger.head_hash == GENESIS_HASH
    assert ledger.total() == 0


def test_append_and_get_roundtrip() -> None:
    ledger = HashChainedTrialLedger()
    ledger.append(_trial("T1", "EXP1", TrialOutcome.RUN))
    got = ledger.get(EntityId("T1"))
    assert got.experiment == EntityId("EXP1")
    assert got.outcome is TrialOutcome.RUN


def test_get_unknown_trial_raises_not_found() -> None:
    ledger = HashChainedTrialLedger()
    with pytest.raises(NotFound):
        ledger.get(EntityId("nope"))


def test_duplicate_enrolment_is_rejected() -> None:
    """CP-2: append-only — the same trial id cannot be enrolled twice."""
    ledger = HashChainedTrialLedger()
    ledger.append(_trial("T1", "EXP1", TrialOutcome.RUN))
    with pytest.raises(Conflict):
        ledger.append(_trial("T1", "EXP1", TrialOutcome.FAILED))


def test_all_outcomes_are_counted() -> None:
    """EX-4/SI-1: RUN, DISCARDED and FAILED all count toward the multiple-testing denominator."""
    ledger = HashChainedTrialLedger()
    ledger.append(_trial("T1", "EXP1", TrialOutcome.RUN))
    ledger.append(_trial("T2", "EXP1", TrialOutcome.DISCARDED))
    ledger.append(_trial("T3", "EXP1", TrialOutcome.FAILED))
    assert ledger.total() == 3
    assert ledger.count(TrialOutcome.DISCARDED) == 1
    assert ledger.count(TrialOutcome.FAILED) == 1


def test_valid_chain_verifies() -> None:
    ledger = HashChainedTrialLedger()
    for i in range(4):
        ledger.append(_trial(f"T{i}", "EXP1", TrialOutcome.RUN))
    ledger.verify()  # must not raise
    assert verify_entries(ledger.entries) is True
    # Each entry links to its predecessor's hash.
    entries = ledger.entries
    for prev, cur in zip(entries, entries[1:]):  # noqa: B905 — intentionally offset by one
        assert cur.prev_hash == prev.entry_hash


def test_tampering_breaks_the_chain() -> None:
    """SEC-4: altering a past entry (without recomputing the chain) is detected."""
    ledger = HashChainedTrialLedger()
    ledger.append(_trial("T1", "EXP1", TrialOutcome.RUN))
    ledger.append(_trial("T2", "EXP1", TrialOutcome.RUN))
    entries = list(ledger.entries)
    # Flip an outcome on entry 0 but keep its stored hash -> chain must fail.
    entries[0] = dataclasses.replace(entries[0], outcome=TrialOutcome.FAILED.value)
    assert verify_entries(tuple(entries)) is False


def test_reordering_breaks_the_chain() -> None:
    """SEC-4: reordering entries breaks seq/linkage and is detected."""
    ledger = HashChainedTrialLedger()
    ledger.append(_trial("T1", "EXP1", TrialOutcome.RUN))
    ledger.append(_trial("T2", "EXP1", TrialOutcome.DISCARDED))
    entries = ledger.entries
    assert verify_entries((entries[1], entries[0])) is False


def test_verify_raises_on_tamper() -> None:
    ledger = HashChainedTrialLedger()
    ledger.append(_trial("T1", "EXP1", TrialOutcome.RUN))
    # Corrupt the internal chain to prove verify() raises (white-box).
    ledger._entries[0] = dataclasses.replace(ledger._entries[0], trial_id="HACKED")  # type: ignore[attr-defined]
    with pytest.raises(LedgerIntegrityError):
        ledger.verify()


def test_deterministic_head_hash() -> None:
    """DE-2: the same append sequence yields the same head hash across independent ledgers."""
    a = HashChainedTrialLedger()
    b = HashChainedTrialLedger()
    for led in (a, b):
        led.append(_trial("T1", "EXP1", TrialOutcome.RUN))
        led.append(_trial("T2", "EXP2", TrialOutcome.FAILED))
    assert a.head_hash == b.head_hash
