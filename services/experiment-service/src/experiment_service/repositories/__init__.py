"""Experiment Repository Interfaces — append-only, immutable repositories (no persistence).

The Trial Ledger (core_domain.experiment.TrialLedger) is append-only and enrolls trials before they
run (P2-01). No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from experiment_service.dependencies import ExperimentDependency
from experiment_service.model import Experiment


class ExperimentRepositoryContract(Protocol):
    """Append-only repository of experiments (immutable; supersede, never mutate, CP-2, EX-3).

    A backward transition (replay/branch) creates a NEW versioned lineage, never a mutation (RL-1).
    """

    def get(self, experiment: EntityId) -> Experiment: ...
    def add(self, experiment: Experiment) -> None: ...


class ExperimentDependencyRepository(Protocol):
    """Retrieval of an experiment's declared dependencies. Interface only."""

    def dependencies_of(self, experiment: EntityId) -> tuple[ExperimentDependency, ...]: ...
