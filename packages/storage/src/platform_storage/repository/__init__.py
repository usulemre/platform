"""Repository Layer — the canonical storage repository abstractions (immutable/append-only/as-of).

These mirror the domain repository patterns at the storage boundary. Immutable artifacts are
append-only (supersede, never mutate, CP-2); historical reads route through an as-of read port (PIT-1).
"""
from __future__ import annotations

from typing import Protocol, TypeVar

from platform_contracts.common import ContentHash, Id

TItem = TypeVar("TItem")


class ReadRepository(Protocol[TItem]):
    """Read side of a storage repository."""

    def get(self, id: Id) -> TItem: ...
    def exists(self, id: Id) -> bool: ...


class AppendOnlyRepository(Protocol[TItem]):
    """Repository for immutable, versioned items: add + supersede, never mutate (CP-2)."""

    def get(self, id: Id) -> TItem: ...
    def add(self, item: TItem) -> None: ...


class ContentAddressedRepository(Protocol[TItem]):
    """Retrieval of immutable items by content address (P1-02)."""

    def by_content_address(self, address: ContentHash) -> TItem: ...


class AsOfReadPort(Protocol[TItem]):
    """Point-in-time read; a historical read without an as-of is impossible by construction (PIT-1)."""

    def read_as_of(self, id: Id, as_of: str) -> TItem: ...
