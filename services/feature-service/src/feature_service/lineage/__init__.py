"""Feature Lineage — the feature lineage model and graph INTERFACE (traceability; defect propagation)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, LineageRef, Ref

from feature_service.model import FeatureIdentifier


@dataclass(frozen=True, slots=True)
class FeatureLineageEdge:
    """A directed lineage edge from an upstream artifact to this feature."""

    upstream: Ref  # dataset or upstream feature, by identity
    downstream: FeatureIdentifier
    transform: str  # a label describing the (declarative) transform; not the computation


@dataclass(frozen=True, slots=True)
class FeatureLineage:
    """Complete lineage of a feature back to its raw dataset sources (DP-1, traceability)."""

    feature: FeatureIdentifier
    lineage_ref: LineageRef
    upstream: tuple[FeatureLineageEdge, ...]


class FeatureLineageGraph(Protocol):
    """The feature lineage graph. Interface only — no storage.

    A defect discovered in any source MUST be able to invalidate this feature and everything
    downstream (CP-6, DP-2).
    """

    def upstream_of(self, feature: EntityId) -> tuple[FeatureLineageEdge, ...]: ...
    def invalidate_downstream(self, feature: EntityId) -> None: ...
