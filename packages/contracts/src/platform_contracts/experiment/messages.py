"""Experiment contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class TrialOutcome(Enum):
    RUN = "run"
    DISCARDED = "discarded"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class ManifestDto(Dto):
    run_manifest_id: str
    config_hash: str


@dataclass(frozen=True, slots=True)
class ExperimentDto(Dto):
    id: Id
    manifest: ManifestDto


@dataclass(frozen=True, slots=True)
class RegisterExperiment(Command):
    hypothesis_id: Id
    manifest: ManifestDto


@dataclass(frozen=True, slots=True)
class RecordTrial(Command):
    """Enroll a trial in the Trial Ledger BEFORE it runs (P2-01); every trial is counted (EX-4)."""

    experiment_id: Id
    outcome: TrialOutcome


@dataclass(frozen=True, slots=True)
class GetExperiment(Query):
    experiment_id: Id


@dataclass(frozen=True, slots=True)
class RegisterExperimentResponse(Response):
    experiment_id: Id
