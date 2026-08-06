"""Dataset Catalog — the authoritative catalog INTERFACE over registered datasets (no storage)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import DatasetClassification, DatasetIdentifier


@dataclass(frozen=True, slots=True)
class CatalogEntry:
    """An immutable catalog entry: a dataset identity + its metadata."""

    identifier: DatasetIdentifier
    metadata: DatasetMetadata


class DatasetCatalog(Protocol):
    """The authoritative catalog of datasets. Interface only — no storage/persistence here."""

    def get(self, identifier: DatasetIdentifier) -> CatalogEntry: ...
    def list_by_classification(self, classification: DatasetClassification) -> tuple[CatalogEntry, ...]: ...
