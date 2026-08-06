"""Dataset Metadata Management — the metadata application service (read + governed update)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.metadata import DatasetMetadata


class DatasetMetadataService(Protocol):
    """Manages dataset catalog metadata. Interface only.

    Metadata is immutable/versioned; a governed update produces a new metadata version (CP-2). No
    persistence here.
    """

    def describe(self, dataset: EntityId) -> DatasetMetadata: ...
    def update_tags(self, dataset: EntityId, tags: tuple[str, ...]) -> DatasetMetadata: ...
