"""Validation Policy — deterministic policy INTERFACES governing how validation runs (no logic)."""
from __future__ import annotations

from typing import Protocol

from platform_validation.model import ValidationMode


class ValidationPolicy(Protocol):
    """Marker for a deterministic, versioned validation policy."""

    ...


class FailureHandlingPolicy(Protocol):
    """Governs fail-fast vs. collect-all behavior. Interface only."""

    def fail_fast(self) -> bool: ...


class RevalidationPolicy(Protocol):
    """Governs when revalidation is required (e.g. on a lineage defect, CP-6). Interface only."""

    def requires_revalidation(self, mode: ValidationMode) -> bool: ...
