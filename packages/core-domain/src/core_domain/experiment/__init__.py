"""Experiment bounded context — registered experiments, manifests, and the Trial Ledger."""
from __future__ import annotations

from .contracts import ExperimentRepository, ReproducibilityService, TrialLedger
from .errors import ManifestMutation, TrialNotCounted, UnregisteredExperiment
from .events import ExperimentRegistered, TrialRecorded
from .model import (
    Experiment,
    ExperimentManifest,
    MultipleTestingBudgetRef,
    Trial,
    TrialOutcome,
)

__all__ = [
    "TrialOutcome", "ExperimentManifest", "MultipleTestingBudgetRef",
    "Experiment", "Trial",
    "ExperimentRegistered", "TrialRecorded",
    "ExperimentRepository", "TrialLedger", "ReproducibilityService",
    "UnregisteredExperiment", "ManifestMutation", "TrialNotCounted",
]
