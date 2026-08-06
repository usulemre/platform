"""Experiment Model — the canonical experiment aggregate and value objects (data only).

Reuses the core experiment domain (core_domain.experiment.ExperimentManifest) for the immutable,
reproducible manifest and the core research domain for the falsifiable prediction.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.experiment import ExperimentManifest
from core_domain.research import FalsifiablePrediction
from core_domain.shared import AggregateRoot, Provenance, Ref, RunManifestRef, Version

from experiment_service.classification import ExperimentClassification
from experiment_service.ownership import ExperimentOwner
from experiment_service.status import ExperimentStatus


@dataclass(frozen=True, slots=True)
class ExperimentIdentifier:
    """A stable, versioned identity for an experiment (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ExperimentObjective:
    """The falsifiable objective of the experiment (SM-1)."""

    statement: str


@dataclass(frozen=True, slots=True)
class ExperimentHypothesis:
    """The experiment's hypothesis; references the core research Hypothesis by identity (SE-2)."""

    hypothesis_ref: Ref  # -> core_domain.research.Hypothesis / research_service initiative
    prediction: FalsifiablePrediction


@dataclass(frozen=True, slots=True)
class ExperimentEvidence:
    """Descriptive evidence; negative results are first-class and preserved (SM-4). Not an adjudication."""

    summary: str
    supports: bool


@dataclass(frozen=True, slots=True)
class ExperimentResultReference:
    """A reference to an experiment RESULT artifact (never the result itself).

    Points to the reproducible backtest/validation artifact by manifest/identity (RP-3).
    """

    run_manifest: RunManifestRef
    artifact: Ref


@dataclass(eq=False)
class Experiment(AggregateRoot):
    """An experiment (aggregate root).

    It carries an immutable manifest (reproducibility, EX-2/3, RP-1). It orchestrates and records; it
    does NOT run statistics/backtests, does NOT adjudicate significance (CP-5), and does NOT observe
    validation/OOS outcomes (AD-3, P2-07).
    """

    identifier: ExperimentIdentifier
    research: Ref  # -> research_service research initiative (source of intent)
    objective: ExperimentObjective
    hypothesis: ExperimentHypothesis | None
    classification: ExperimentClassification
    owner: ExperimentOwner
    status: ExperimentStatus
    manifest: ExperimentManifest
    provenance: Provenance
