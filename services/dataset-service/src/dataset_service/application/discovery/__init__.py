"""Dataset Discovery — the catalog discovery application service (access-filtered)."""
from __future__ import annotations

from typing import Protocol

from dataset_service.discovery import DiscoveryQuery, DiscoveryResult


class DatasetDiscoveryService(Protocol):
    """Discovers datasets from the catalog subject to access control (default-deny). Interface only.

    Never surfaces data above the caller's clearance (SEC-2).
    """

    def discover(self, query: DiscoveryQuery) -> DiscoveryResult: ...
