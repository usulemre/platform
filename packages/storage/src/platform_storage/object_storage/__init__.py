"""Object Storage — the canonical object-store abstraction (content-addressed; WORM; no client).

Vendor-neutral object storage (S3-compatible behind an adapter, per TDR). Objects are content-addressed
and may be WORM (write-once-read-many) for tamper-evidence (SEC-4). No object-store client here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ContentHash


@dataclass(frozen=True, slots=True)
class ObjectRef:
    """An immutable, content-addressed reference to a stored object (P1-02)."""

    address: ContentHash


class ObjectStore(Protocol):
    """A vendor-neutral object store. Interface only — no object-store client/bytes here.

    ``put`` records an immutable, content-addressed object and returns its reference; existing objects
    are never mutated (CP-2). WORM objects support tamper-evident audit (SEC-4).
    """

    def put(self, address: ContentHash) -> ObjectRef: ...
    def get(self, ref: ObjectRef) -> ContentHash: ...
    def exists(self, ref: ObjectRef) -> bool: ...
