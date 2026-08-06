"""Feature Policies — deterministic policy INTERFACES governing features (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class FeaturePolicy(Protocol):
    """Marker for a deterministic, versioned feature policy."""

    ...


class AsOfComputationPolicy(Protocol):
    """A feature is computed only through the as-of path; no look-ahead (FA-1, PIT-3). Interface only."""

    def is_as_of_only(self, feature: EntityId) -> bool: ...


class LeakageClearancePolicy(Protocol):
    """A feature is accepted only after the deterministic Leakage Harness passes (FA-2, P2-03). Interface only."""

    def is_leakage_clean(self, feature: EntityId) -> bool: ...


class ProvenanceRequiredPolicy(Protocol):
    """No feature without full provenance and a Run Manifest (FA-3, DP-3). Interface only."""

    def has_provenance(self, feature: EntityId) -> bool: ...


class ImmutabilityPolicy(Protocol):
    """A feature version is immutable; a change creates a new version (FA-4, CP-2). Interface only."""

    def is_mutation_allowed(self, feature: EntityId) -> bool: ...
