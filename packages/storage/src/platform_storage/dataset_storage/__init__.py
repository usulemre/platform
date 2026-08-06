"""Dataset Storage — the canonical bitemporal dataset-store INTERFACE (as-of; vintages; no DB).

Historical reads route through an as-of read (PIT-1); restatements are appended as new vintages and
never overwritten (DI-3). No database here.
"""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import ContentHash

from platform_storage.core import StorageIdentifier
from platform_storage.object_storage import ObjectRef


class DatasetStore(Protocol):
    """A vendor-neutral, bitemporal dataset store. Interface only — no database/persistence here.

    ``read_as_of`` is the only historical read path (fail-closed without an as-of, PIT-1);
    ``append_vintage`` records a restatement as a new vintage, never overwriting one (DI-3).
    """

    def read_as_of(self, dataset: StorageIdentifier, as_of: str) -> ObjectRef: ...
    def append_vintage(self, dataset: StorageIdentifier, content: ContentHash) -> None: ...
