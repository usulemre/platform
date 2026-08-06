"""Validation Integration — the admin request-validation INTERFACE (Validation Foundation; mandatory)."""
from __future__ import annotations

from typing import Protocol

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class AdminRequestValidator(Protocol):
    """Validates an admin request via the Validation Foundation before processing. Interface only.

    Validation is mandatory and structural (never statistical, AI-2); a failed validation rejects the
    request fail-closed. The Admin API MUST NOT bypass validation.
    """

    def validate(self, request_ref: str, context: ValidationContext) -> ValidationReport: ...
