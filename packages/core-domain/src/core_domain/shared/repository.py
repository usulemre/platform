"""Canonical repository interface patterns. Interfaces only — no persistence in the domain."""
from __future__ import annotations

from typing import Protocol, TypeVar

from .identifiers import ContentAddress, EntityId
from .time import AsOf

TAgg = TypeVar("TAgg")


class ReadRepository(Protocol[TAgg]):
    """Read side of a bounded-context repository."""

    def get(self, id: EntityId) -> TAgg: ...
    def exists(self, id: EntityId) -> bool: ...


class AppendOnlyRepository(Protocol[TAgg]):
    """Repository for immutable, versioned artifacts: add + supersede, never mutate (CP-2)."""

    def get(self, id: EntityId) -> TAgg: ...
    def add(self, aggregate: TAgg) -> None: ...


class ContentAddressedRepository(Protocol[TAgg]):
    """Retrieval of immutable artifacts by content address (P1-02)."""

    def by_content_address(self, address: ContentAddress) -> TAgg: ...


class AsOfReadPort(Protocol[TAgg]):
    """Point-in-time read; a call without an ``AsOf`` is impossible by construction (PIT-1)."""

    def read_as_of(self, id: EntityId, as_of: AsOf) -> TAgg: ...
