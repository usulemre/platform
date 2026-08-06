"""Archive Management — the archive policy model and archive-service INTERFACE (tiering; no infra).

Archival moves items to colder tiers per policy (SC-2, P5-01) while preserving immutability and
reproducibility; reproducibility-critical items remain retrievable. No infrastructure here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_storage.core import StorageClass


@dataclass(frozen=True, slots=True)
class ArchivePolicy:
    """An archival policy: when to archive and to which (colder) tier (SC-2)."""

    archive_after_days: int
    tier: StorageClass
    immutable: bool


class ArchiveService(Protocol):
    """Archives/restores items per policy. Interface only — no infrastructure.

    Archival preserves immutability and reproducibility; it never deletes reproducibility-critical
    items (RP-4).
    """

    def archive(self, item: Id) -> None: ...
    def restore(self, item: Id) -> None: ...
