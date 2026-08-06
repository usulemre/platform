"""Snapshot Storage — the canonical snapshot model and snapshot-store INTERFACE (time-travel; no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ContentHash

from platform_storage.core import StorageIdentifier


@dataclass(frozen=True, slots=True)
class StorageSnapshot:
    """An immutable, content-addressed snapshot (time-travel; reproducibility support, CP-2)."""

    identifier: StorageIdentifier
    taken_at: str
    content: ContentHash


class SnapshotStore(Protocol):
    """Append-only snapshot store enabling time-travel/recovery. Interface only — no persistence."""

    def create(self, identifier: StorageIdentifier) -> StorageSnapshot: ...
    def get(self, identifier: StorageIdentifier) -> StorageSnapshot: ...
