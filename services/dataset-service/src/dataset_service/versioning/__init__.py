"""Dataset Versioning — version-upgrade and schema-evolution INTERFACES (no logic)."""
from __future__ import annotations

from typing import Protocol

from dataset_service.model import DatasetIdentifier, DatasetVersion
from dataset_service.schema import DatasetSchema, SchemaEvolution


class VersioningPolicy(Protocol):
    """Governs how a new dataset version is derived; a version is immutable once created (CP-2)."""

    def is_compatible(self, current: DatasetSchema, candidate: DatasetSchema) -> bool: ...


class DatasetVersioningService(Protocol):
    """Creates new immutable versions and applies governed schema evolution. Interface only.

    A new version re-enters the validation lifecycle; historical versions are preserved (VER-2, RP-4).
    """

    def create_version(self, identifier: DatasetIdentifier) -> DatasetVersion: ...
    def evolve_schema(self, evolution: SchemaEvolution) -> DatasetSchema: ...
