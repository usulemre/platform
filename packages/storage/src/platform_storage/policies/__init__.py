"""Storage Policies — the versioned storage policy model and governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id, SchemaVersion


@dataclass(frozen=True, slots=True)
class StoragePolicy:
    """A named, versioned, deterministic storage policy. Immutable; a change is a new version."""

    name: str
    version: SchemaVersion
    description: str


class ImmutabilityPolicy(Protocol):
    """Immutable artifacts are never mutated; a change creates a new version (CP-2). Interface only."""

    def is_mutation_allowed(self, item: Id) -> bool: ...


class ReproducibilityPolicy(Protocol):
    """Reproducibility-critical data is retained and reproducible from its manifest (RP-1/4). Interface only."""

    def is_reproducible(self, item: Id) -> bool: ...


class TraceabilityPolicy(Protocol):
    """Every stored item carries provenance/lineage for governance traceability (CP-6/7). Interface only."""

    def has_provenance(self, item: Id) -> bool: ...


class VendorIndependencePolicy(Protocol):
    """No core logic depends on a specific storage vendor (AV2-12). Interface only."""

    def is_vendor_neutral(self, item: Id) -> bool: ...
