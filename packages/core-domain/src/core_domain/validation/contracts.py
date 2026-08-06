"""Validation engine interfaces — the deterministic core's adjudication ports (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import ReplicationResult, ValidationRun, Verdict


class ValidationRunRepository(Protocol):
    """Append-only repository of validation runs."""

    def get(self, id: EntityId) -> ValidationRun: ...
    def add(self, run: ValidationRun) -> None: ...


class MultipleTestingEnforcer(Protocol):
    """Interface: deterministic multiple-testing budget gate over the Trial Ledger (P2-02)."""

    def check_budget(self, subject: EntityId) -> Verdict: ...


class ValidationGauntlet(Protocol):
    """Interface: leakage harness + purged/embargoed CPCV + PBO (deterministic)."""

    def run(self, subject: EntityId) -> Verdict: ...


class HoldoutEmbargoManager(Protocol):
    """Interface: one-shot, rotating holdout allocation; iterative reuse is PROHIBITED (SI-4)."""

    def allocate(self, subject: EntityId) -> None: ...


class ReplicationEngine(Protocol):
    """Interface: independent replication by a separate code path (VS-4, P2-08)."""

    def replicate(self, subject: EntityId) -> ReplicationResult: ...


class ScientificGate(Protocol):
    """Interface: the Pre-Capital Scientific Gate that issues capital-eligibility tokens (P2-09).

    Deterministic; an LLM MUST NEVER assert significance or issue a token (AI-2, AI-3).
    """

    def adjudicate(self, subject: EntityId) -> Verdict: ...
