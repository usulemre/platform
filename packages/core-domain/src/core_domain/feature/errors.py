"""Feature domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class LeakageDetected(DomainError):
    """A feature failed the leakage harness (FA-2, P2-03)."""


class LookAheadBias(DomainError):
    """A feature used full-sample/future-leaking statistics (PIT-3, FB-7)."""


class MissingFeatureProvenance(DomainError):
    """A feature lacks provenance (FB-11, DP-3)."""
