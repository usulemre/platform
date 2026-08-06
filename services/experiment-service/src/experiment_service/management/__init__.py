"""Experiment Management — the Experiment Service application/orchestration INTERFACES (no adjudication).

These interfaces orchestrate the experiment lifecycle and connect Research/Datasets/Features/
Validation/Backtesting by dependency. They ORCHESTRATE and RECORD; they NEVER run statistics/backtests
and NEVER adjudicate significance (CP-5, AI-2). No statistical logic, no persistence.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from experiment_service.dependencies import ExperimentDependency
from experiment_service.metadata import ExperimentMetadata
from experiment_service.model import Experiment


class ExperimentService(Protocol):
    """The Experiment Service (interface only): drive the lifecycle of an experiment."""

    def register(self, experiment: Experiment) -> EntityId: ...
    def configure(self, experiment: EntityId) -> None: ...
    def start(self, experiment: EntityId) -> None: ...
    def complete(self, experiment: EntityId) -> None: ...
    def submit_for_validation(self, experiment: EntityId) -> None: ...
    def approve(self, experiment: EntityId) -> None: ...
    def archive(self, experiment: EntityId) -> None: ...


class ExperimentManagementService(Protocol):
    """Orchestrates dependencies and records deterministic gate outcomes. Interface only.

    It records (never computes) the outcome of the deterministic execution/validation gates.
    """

    def declare_dependency(self, experiment: EntityId, dependency: ExperimentDependency) -> None: ...
    def record_validation_outcome(self, experiment: EntityId, passed: bool) -> None: ...


class ExperimentCatalogService(Protocol):
    """Describes experiments from the catalog. Interface only."""

    def describe(self, experiment: EntityId) -> ExperimentMetadata: ...
