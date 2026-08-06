"""Dataset Version Management — version creation, promotion, and governed dataset replacement."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import DatasetIdentifier, DatasetVersion


class DatasetVersionManagementService(Protocol):
    """Application service for dataset versions. Interface only.

    A new or promoted version re-enters validation; historical versions are preserved (CP-2, VER-2,
    RP-4). Promotion moves a validated version to PUBLISHED; replacement supersedes an old dataset
    (which is then deprecated), never mutating it.
    """

    def create_version(self, identifier: DatasetIdentifier) -> DatasetVersion: ...
    def promote_version(self, version: EntityId) -> None: ...
    def replace_dataset(self, old: EntityId, new: EntityId) -> None: ...
