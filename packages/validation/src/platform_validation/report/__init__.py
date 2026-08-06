"""Validation Report — the immutable, auditable aggregation of validation results (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_validation.metadata import ValidationMetadata
from platform_validation.result import ValidationResult


@dataclass(frozen=True, slots=True)
class ReportSummary:
    """A count summary over the report's results."""

    total: int
    passed: int
    failed: int


@dataclass(frozen=True, slots=True)
class ValidationReport:
    """An immutable, auditable report aggregating validation results (CP-7)."""

    metadata: ValidationMetadata
    results: tuple[ValidationResult, ...]
    summary: ReportSummary
