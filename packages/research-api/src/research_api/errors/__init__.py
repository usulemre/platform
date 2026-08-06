"""Error Model — the canonical, technology-independent API error model (no internal details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ApiErrorKind(Enum):
    VALIDATION_FAILED = "validation_failed"      # request failed validation (fail-closed)
    UNAUTHENTICATED = "unauthenticated"
    FORBIDDEN = "forbidden"                      # authorization denied (default-deny, SEC-2)
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    WORKFLOW_REQUIRED = "workflow_required"      # a consequential op requires a workflow (WCON-2)
    DOMAIN_MODEL_LEAK = "domain_model_leak"      # an internal domain model was exposed (boundary, SE-2)
    RATE_LIMITED = "rate_limited"
    INTERNAL = "internal"


@dataclass(frozen=True, slots=True)
class ApiError:
    """A canonical, technology-independent API error (leaks no internal/provider details)."""

    kind: ApiErrorKind
    code: str
    message: str
