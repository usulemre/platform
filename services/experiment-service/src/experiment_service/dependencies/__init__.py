"""Experiment Dependency Management — links to research/datasets/features/validation/backtest (by id).

All links are by identity/reference (SE-2); no experiment module reaches into another context's
internals, and none creates a channel that would let generation observe validation/OOS (AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class DependencyKind(Enum):
    RESEARCH = "research"          # source of research intent (Research Service)
    DATASET = "dataset"           # Dataset Service references
    FEATURE = "feature"
    VALIDATION = "validation"     # a reference only; outcomes are not observable by generation
    BACKTEST = "backtest"         # execution is delegated to the Backtesting engine
    PRIOR_EXPERIMENT = "prior_experiment"


@dataclass(frozen=True, slots=True)
class ExperimentDependency:
    """A declared dependency of an experiment on another artifact, by identity."""

    kind: DependencyKind
    target: Ref


class ExperimentDependencyService(Protocol):
    """Declares and lists experiment dependencies. Interface only — hidden dependencies are PROHIBITED."""

    def declare(self, experiment: EntityId, dependency: ExperimentDependency) -> None: ...
