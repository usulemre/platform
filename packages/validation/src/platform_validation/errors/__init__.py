"""Validation Errors — framework-level error definitions (distinct from a validation FAILURE)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ValidationErrorCode(Enum):
    INVALID_CONTEXT = "validation.invalid_context"
    UNREGISTERED_VALIDATOR = "validation.unregistered_validator"
    PIPELINE_STAGE_FAILED = "validation.pipeline_stage_failed"
    ILLEGAL_LIFECYCLE_TRANSITION = "validation.illegal_lifecycle_transition"
    SPECIFICATION_UNSATISFIED = "validation.specification_unsatisfied"


class ValidationFrameworkError(Exception):
    """Base for validation-FRAMEWORK faults (misuse), NOT a domain/statistical verdict.

    A validation FAILURE (see result.ValidationFailure) is a legitimate structural outcome; a
    framework error means the validation could not run correctly.
    """


@dataclass(frozen=True, slots=True)
class ValidationError:
    """A structured, immutable framework error (a fact)."""

    code: ValidationErrorCode
    detail: str
