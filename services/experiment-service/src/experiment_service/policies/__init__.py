"""Experiment Policies — deterministic policy INTERFACES governing experiments (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExperimentPolicy(Protocol):
    """Marker for a deterministic, versioned experiment policy."""

    ...


class RegisterBeforeRunPolicy(Protocol):
    """No experiment runs before registration with a manifest and Trial-Ledger entry (SM-5, EX-1). Interface only."""

    def is_registered(self, experiment: EntityId) -> bool: ...


class ManifestImmutabilityPolicy(Protocol):
    """A registered experiment manifest is immutable; a change creates a new version (EX-3). Interface only."""

    def is_mutation_allowed(self, experiment: EntityId) -> bool: ...


class TrialCountingPolicy(Protocol):
    """Every trial (run, discarded, or failed) is counted in the Trial Ledger (EX-4). Interface only."""

    def is_counted(self, trial: EntityId) -> bool: ...


class ReproducibilityPolicy(Protocol):
    """No experiment result without a captured manifest ('no optimization without reproducibility', RP-2)."""

    def has_manifest(self, experiment: EntityId) -> bool: ...


class IsolationBarrierPolicy(Protocol):
    """Experiment generation MUST NOT observe validation/OOS outcomes (AD-3, P2-07). Interface only."""

    def may_observe(self, experiment: EntityId, resource: str) -> bool: ...
