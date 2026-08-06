"""Dataset Discovery — the discovery/query INTERFACE over the catalog (no storage)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import DataClassificationKind, SensitivityClass


@dataclass(frozen=True, slots=True)
class DiscoveryQuery:
    """An immutable discovery query (text and/or classification filters)."""

    text: str | None
    kind: DataClassificationKind | None
    max_sensitivity: SensitivityClass | None  # never surfaces data above the caller's clearance (SEC-2)


@dataclass(frozen=True, slots=True)
class DiscoveryResult:
    """The immutable result of a discovery query (metadata only, access-filtered)."""

    matches: tuple[DatasetMetadata, ...]


class DatasetDiscovery(Protocol):
    """Searches the catalog subject to access control (default-deny). Interface only."""

    def search(self, query: DiscoveryQuery) -> DiscoveryResult: ...
