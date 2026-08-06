"""Experiment Specifications — composable STRUCTURAL predicates over experiments (no statistics).

These check structural readiness (registered, configured, manifest present, dependencies declared),
NOT statistical significance or promotion — those are the deterministic Validation engine's decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TExperiment = TypeVar("TExperiment", contravariant=True)


class ExperimentSpecification(Protocol[TExperiment]):
    """A composable, deterministic structural predicate over an experiment. Interface only."""

    def is_satisfied_by(self, experiment: TExperiment) -> bool: ...


class ReadyToRunSpecification(Protocol[TExperiment]):
    """Structural readiness to run (registered, configured, manifest present, dependencies declared).

    STRUCTURAL only — it does not judge results. Interface only.
    """

    def is_satisfied_by(self, experiment: TExperiment) -> bool: ...


class ReproducibleSpecification(Protocol[TExperiment]):
    """Structural reproducibility check (has an immutable manifest + config hash, RP-1). Interface only."""

    def is_satisfied_by(self, experiment: TExperiment) -> bool: ...
