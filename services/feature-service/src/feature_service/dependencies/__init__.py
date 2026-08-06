"""Feature Dependency Management — links from a feature to datasets/features/research/experiments (by id).

All links are by identity/reference (SE-2); no feature module reaches into another context's
internals, and none creates a channel that would let generation observe validation/OOS (AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class DependencyKind(Enum):
    DATASET = "dataset"              # Data Platform / Dataset Service references
    UPSTREAM_FEATURE = "upstream_feature"
    RESEARCH = "research"            # Research Service context
    EXPERIMENT = "experiment"        # Experiment Service references
    VALIDATION = "validation"        # a reference only; outcomes are not observable by generation


@dataclass(frozen=True, slots=True)
class FeatureDependency:
    """A declared dependency of a feature on another artifact, by identity."""

    kind: DependencyKind
    target: Ref


class FeatureDependencyService(Protocol):
    """Declares and lists feature dependencies. Interface only — hidden dependencies are PROHIBITED."""

    def declare(self, feature: EntityId, dependency: FeatureDependency) -> None: ...
