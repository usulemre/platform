"""Experiment repository, trial-ledger, and reproducibility contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import ExperimentDto, RecordTrial, RegisterExperiment, RegisterExperimentResponse


class ExperimentRepositoryContract(Protocol):
    def get(self, id: Id) -> ExperimentDto: ...
    def add(self, experiment: ExperimentDto) -> None: ...


class TrialLedgerContract(Protocol):
    """Append-only, tamper-evident ledger; enroll before run (P2-01)."""

    def append(self, command: RecordTrial) -> None: ...


class ExperimentServiceContract(Protocol):
    def register(self, command: RegisterExperiment) -> RegisterExperimentResponse: ...
