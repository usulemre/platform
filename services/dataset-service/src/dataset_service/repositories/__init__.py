"""Dataset Repository Interfaces — append-only, immutable repositories (no persistence).

The domain read path (point-in-time) is core_domain.dataset.AsOfGateway; these platform repositories
add catalog/version/lineage retrieval. No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lineage import DatasetLineage
from dataset_service.model import Dataset, DatasetVersion


class DatasetRepositoryContract(Protocol):
    """Append-only repository of dataset aggregates (immutable; supersede, never mutate, CP-2)."""

    def get(self, dataset: EntityId) -> Dataset: ...
    def add(self, dataset: Dataset) -> None: ...


class DatasetVersionRepository(Protocol):
    """Append-only repository of immutable dataset versions."""

    def get(self, version: EntityId) -> DatasetVersion: ...
    def add(self, version: DatasetVersion) -> None: ...


class LineageRepository(Protocol):
    """Retrieval of a dataset's complete lineage. Interface only."""

    def lineage_of(self, dataset: EntityId) -> DatasetLineage: ...
