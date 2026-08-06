"""Experiment domain model — registered experiments, immutable manifests, and the Trial Ledger."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, EntityId, Provenance, RunManifestRef, VersionedId

# --- Value Objects ---------------------------------------------------------


class TrialOutcome(Enum):
    RUN = "run"
    DISCARDED = "discarded"
    FAILED = "failed"  # every trial is counted for multiple-testing control (EX-4)


@dataclass(frozen=True, slots=True)
class ExperimentManifest:
    """The immutable manifest that makes an experiment independently repeatable (EX-2, RP-1)."""

    run_manifest: RunManifestRef
    config_hash: str


@dataclass(frozen=True, slots=True)
class MultipleTestingBudgetRef:
    """Reference to the budget an experiment is accounted against (SI-1, P2-02)."""

    id: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Trial(AggregateRoot):
    """A single trial recorded in the immutable Trial Ledger before it runs (SM-5, P2-01)."""

    experiment: EntityId
    outcome: TrialOutcome


@dataclass(eq=False)
class Experiment(AggregateRoot):
    """A registered experiment (aggregate root); metadata is immutable (EX-3)."""

    experiment_id: VersionedId
    hypothesis: EntityId
    manifest: ExperimentManifest
    provenance: Provenance
