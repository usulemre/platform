"""Metadata Storage — the canonical storage metadata model and metadata-store INTERFACE (traceable)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_storage.core import StorageIdentifier, StorageKind


@dataclass(frozen=True, slots=True)
class StorageMetadata:
    """Immutable, auditable metadata for a stored item (governance traceability, CP-6/7).

    ``lineage_ref`` and ``produced_by`` carry provenance references so a defect in a source can
    invalidate downstream (CP-6).
    """

    identifier: StorageIdentifier
    kind: StorageKind
    owner_role: str
    lineage_ref: str
    produced_by: str
    tags: tuple[str, ...]


class MetadataStore(Protocol):
    """Append-only metadata store (immutable, traceable). Interface only — no persistence."""

    def put(self, metadata: StorageMetadata) -> None: ...
    def get(self, item: Id) -> StorageMetadata: ...
