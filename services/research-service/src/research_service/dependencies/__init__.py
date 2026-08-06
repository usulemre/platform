"""Research Dependencies — links from a research initiative to datasets/features/experiments (by id).

These are the connective tissue of the orchestration layer. All links are by identity/reference
(SE-2); no research module reaches into another context's internals, and none creates a channel that
would let generation observe validation/OOS outcomes (AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import Ref


class DependencyKind(Enum):
    DATASET = "dataset"
    FEATURE = "feature"
    EXPERIMENT = "experiment"
    VALIDATION = "validation"      # a reference only; outcomes are not observable by generation
    PRIOR_RESEARCH = "prior_research"


@dataclass(frozen=True, slots=True)
class ResearchDependency:
    """A declared dependency of a research initiative on another artifact, by identity."""

    kind: DependencyKind
    target: Ref
