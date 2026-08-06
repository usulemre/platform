"""Validation engine contracts — the deterministic adjudication ports (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    AllocateHoldout,
    RequestReplication,
    RunValidation,
    ValidationVerdictResponse,
)


class ValidationRepositoryContract(Protocol):
    def get(self, id: Id) -> ValidationVerdictResponse: ...


class MultipleTestingEnforcerContract(Protocol):
    """Deterministic multiple-testing budget gate over the Trial Ledger (P2-02)."""

    def check_budget(self, subject_id: Id) -> ValidationVerdictResponse: ...


class ValidationGauntletContract(Protocol):
    """Leakage harness + purged/embargoed CPCV + PBO (deterministic)."""

    def run(self, command: RunValidation) -> ValidationVerdictResponse: ...


class HoldoutEmbargoManagerContract(Protocol):
    """One-shot, rotating holdout allocation (SI-4)."""

    def allocate(self, command: AllocateHoldout) -> None: ...


class ReplicationEngineContract(Protocol):
    """Independent replication by a separate code path (VS-4, P2-08)."""

    def replicate(self, command: RequestReplication) -> ValidationVerdictResponse: ...


class ScientificGateContract(Protocol):
    """Issues capital-eligibility tokens; an LLM MUST NEVER assert significance (AI-2/3, P2-09)."""

    def adjudicate(self, subject_id: Id) -> ValidationVerdictResponse: ...
