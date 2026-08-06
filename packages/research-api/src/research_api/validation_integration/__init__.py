"""Validation Integration — the API request-validation INTERFACE (Validation Foundation; mandatory).

The API MUST NOT bypass the Validation Foundation. Structural request validation only; not statistical.
"""
from __future__ import annotations

from typing import Protocol

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class ApiRequestValidator(Protocol):
    """Validates an API request via the Validation Foundation before processing. Interface only.

    Validation is mandatory and structural (never statistical, AI-2); a failed validation rejects the
    request fail-closed.
    """

    def validate(self, request_ref: str, context: ValidationContext) -> ValidationReport: ...
