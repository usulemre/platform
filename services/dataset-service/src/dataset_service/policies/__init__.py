"""Dataset Policies — deterministic platform policy INTERFACES (retention, immutability, PIT)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lifecycle import DatasetLifecycle


class DatasetPolicy(Protocol):
    """Marker for a deterministic, versioned dataset policy."""

    ...


class RetentionPolicy(Protocol):
    """Reproducibility-critical datasets are never garbage-collected (RP-4, P5-01). Interface only."""

    def may_archive(self, dataset: EntityId) -> bool: ...


class ImmutabilityPolicy(Protocol):
    """A published dataset version is immutable; a change creates a new version (CP-2). Interface only."""

    def is_mutation_allowed(self, status: DatasetLifecycle) -> bool: ...


class PointInTimePolicy(Protocol):
    """All historical reads are as-of and survivorship-safe (PIT-1/2). Interface only."""

    def requires_as_of(self) -> bool: ...
    def requires_survivorship_safety(self) -> bool: ...
