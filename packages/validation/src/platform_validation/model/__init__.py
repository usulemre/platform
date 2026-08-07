"""Validation Model — the taxonomy, lifecycle, modes, and the Validation/Validator core (data + interface).

Structural validation only; this model asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING, Protocol, TypeVar

from platform_contracts.common import Id

if TYPE_CHECKING:  # imported for typing only — avoids any runtime import cycle
    from platform_validation.context import ValidationContext
    from platform_validation.result import ValidationResult


class ValidationCategory(Enum):
    """The institutional validation taxonomy (one category per domain that validates structurally)."""

    DATASET = "dataset"
    RESEARCH = "research"
    EXPERIMENT = "experiment"
    FEATURE = "feature"
    SIGNAL = "signal"
    STRATEGY = "strategy"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    WORKFLOW = "workflow"
    CONFIGURATION = "configuration"
    GOVERNANCE = "governance"


class ValidationLifecycle(Enum):
    """The canonical validation lifecycle."""

    CREATED = "created"
    PRE_VALIDATION = "pre_validation"
    VALIDATING = "validating"
    PASSED = "passed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ValidationMode(Enum):
    """Validation modes supported by the framework (composability)."""

    FULL = "full"
    PARTIAL = "partial"
    INCREMENTAL = "incremental"
    COMPOSITE = "composite"
    REVALIDATION = "revalidation"


class Severity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ValidationStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    PARTIAL = "partial"
    SKIPPED = "skipped"


L = ValidationLifecycle

#: The canonical lifecycle transitions (revalidation re-enters PRE_VALIDATION).
CANONICAL_TRANSITIONS: tuple[tuple[ValidationLifecycle, ValidationLifecycle], ...] = (
    (L.CREATED, L.PRE_VALIDATION),
    (L.PRE_VALIDATION, L.VALIDATING),
    (L.VALIDATING, L.PASSED),
    (L.VALIDATING, L.FAILED),
    (L.PASSED, L.ARCHIVED),
    (L.FAILED, L.ARCHIVED),
    # revalidation
    (L.PASSED, L.PRE_VALIDATION),
    (L.FAILED, L.PRE_VALIDATION),
)

TSubject = TypeVar("TSubject", contravariant=True)


@dataclass(frozen=True, slots=True)
class Validation:
    """An immutable record of one structural validation instance over a subject."""

    validation_id: Id
    category: ValidationCategory
    mode: ValidationMode
    lifecycle: ValidationLifecycle


class Validator(Protocol[TSubject]):
    """A deterministic, structural validator over a subject. Interface only.

    Composed from rules/specifications; behavior lives in an outer engine. It performs NO statistical
    test and asserts NO significance (AI-2, DE-4); a FAILED result is a structural outcome, not a
    scientific verdict.
    """

    def validate(self, subject: TSubject, context: ValidationContext) -> ValidationResult: ...
