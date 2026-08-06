"""Storage Providers — the canonical storage provider model, capabilities, and registry (no vendor)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_storage.core import StorageKind


@dataclass(frozen=True, slots=True)
class StorageCapabilities:
    """The vendor-neutral capabilities a storage backend supports (compatibility, not a vendor model)."""

    kinds: tuple[StorageKind, ...]
    supports_versioning: bool
    supports_snapshots: bool
    supports_worm: bool


@dataclass(frozen=True, slots=True)
class StorageProvider:
    """A canonical, vendor-neutral storage backend (e.g. relational/object/lakehouse), by identity."""

    provider_id: Id
    name: str
    capabilities: StorageCapabilities


class StorageProviderRegistry(Protocol):
    """Register-before-use registry of storage providers. Interface only — no persistence.

    A provider is not usable before registration; the concrete registry stores elsewhere; no vendor
    details leak through the registry.
    """

    def register(self, provider: StorageProvider) -> None: ...
    def get(self, provider: Id) -> StorageProvider: ...
