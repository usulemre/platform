"""Dataset Search — text/faceted search over dataset metadata (access-filtered; no index engine)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import DataClassificationKind, SensitivityClass


@dataclass(frozen=True, slots=True)
class DatasetSearchQuery:
    """An immutable text/faceted search query."""

    text: str | None
    tags: tuple[str, ...]
    kind: DataClassificationKind | None
    max_sensitivity: SensitivityClass | None  # results never exceed the caller's clearance (SEC-2)


class DatasetSearchService(Protocol):
    """Searches dataset metadata, access-filtered. Interface only — no search-index engine here."""

    def search(self, query: DatasetSearchQuery) -> tuple[DatasetMetadata, ...]: ...
