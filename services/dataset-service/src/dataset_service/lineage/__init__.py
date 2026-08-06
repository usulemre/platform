"""Data Lineage — the lineage model and graph INTERFACE (defect propagation; no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, LineageRef

from dataset_service.model import DatasetIdentifier


@dataclass(frozen=True, slots=True)
class LineageNode:
    """A node in the lineage graph (a dataset version)."""

    dataset: DatasetIdentifier
    lineage_ref: LineageRef


@dataclass(frozen=True, slots=True)
class LineageEdge:
    """A directed lineage edge from an upstream to a downstream dataset."""

    upstream: DatasetIdentifier
    downstream: DatasetIdentifier
    transform: str


@dataclass(frozen=True, slots=True)
class DatasetLineage:
    """Complete lineage of a dataset back toward raw sources (DP-1)."""

    node: LineageNode
    upstream: tuple[LineageEdge, ...]


class LineageGraph(Protocol):
    """The lineage graph. Interface only — no storage.

    A defect discovered in any source MUST be able to invalidate everything downstream (CP-6, DP-2).
    """

    def upstream_of(self, dataset: EntityId) -> tuple[LineageEdge, ...]: ...
    def downstream_of(self, dataset: EntityId) -> tuple[LineageEdge, ...]: ...
    def invalidate_downstream(self, dataset: EntityId) -> None: ...
