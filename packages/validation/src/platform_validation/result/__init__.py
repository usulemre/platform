"""Validation Result — the immutable success/failure records of a structural validation (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Violation  # reuse the atomic structural violation

from platform_validation.model import Severity, ValidationStatus


@dataclass(frozen=True, slots=True)
class ValidationSuccess:
    """A rule that was satisfied."""

    rule: str


@dataclass(frozen=True, slots=True)
class ValidationFailure:
    """A rule that was violated (a structural outcome, NOT a statistical verdict)."""

    rule: str
    severity: Severity
    violation: Violation


@dataclass(frozen=True, slots=True)
class ValidationResult:
    """The immutable outcome of a structural validation: status + successes + failures."""

    status: ValidationStatus
    successes: tuple[ValidationSuccess, ...]
    failures: tuple[ValidationFailure, ...]
