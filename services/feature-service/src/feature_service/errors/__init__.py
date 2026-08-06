"""Feature Errors — Feature Service domain errors (each expresses a violated feature invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class FeatureError(DomainError):
    """Base for Feature Service errors."""


class FeatureNotRegistered(FeatureError):
    """A feature was used/published before registration (register-before-use, FA-1)."""


class LeakageNotCleared(FeatureError):
    """A feature was approved/activated before the Leakage Harness passed (FA-2, P2-03)."""


class LookAheadComputation(FeatureError):
    """A feature was defined with look-ahead / full-sample statistics (PIT-3, FB-7)."""


class MissingFeatureProvenance(FeatureError):
    """A feature lacks full provenance / a Run Manifest (FA-3, FB-11)."""


class ImmutableVersionMutation(FeatureError):
    """An attempt to mutate an immutable feature version (FA-4, CP-2)."""


class FeatureSelfAdjudication(FeatureError):
    """The Feature Service attempted to adjudicate significance/acceptance (separation of powers, CP-5)."""


class IsolationBarrierBreach(FeatureError):
    """Generation observed validation/OOS outcomes (AD-3, P2-07)."""


class IllegalFeatureTransition(FeatureError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(FeatureError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
