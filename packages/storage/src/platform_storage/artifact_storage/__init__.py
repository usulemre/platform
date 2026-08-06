"""Artifact Storage — immutable research-artifact model and store INTERFACE (reproducibility, no persistence).

Research artifacts are immutable and content-addressed (CP-2); each references its Run Manifest so it
reproduces bit-for-bit (P1-02, RP-1). Reproducibility-critical artifacts are never GC'd (RP-4).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ContentHash

from platform_storage.core import StorageIdentifier


@dataclass(frozen=True, slots=True)
class StorageArtifact:
    """An immutable, content-addressed research artifact (CP-2).

    ``manifest_ref`` references the Run Manifest that reproduces it (P1-02); a change creates a new
    version, never a mutation.
    """

    identifier: StorageIdentifier
    content: ContentHash
    manifest_ref: str
    reproducibility_critical: bool


class ArtifactStore(Protocol):
    """Append-only store for immutable research artifacts. Interface only — no persistence.

    It never mutates an artifact (supersede by version, CP-2); reproducibility-critical artifacts are
    never garbage-collected (RP-4, P5-01).
    """

    def put(self, artifact: StorageArtifact) -> None: ...
    def get(self, identifier: StorageIdentifier) -> StorageArtifact: ...
