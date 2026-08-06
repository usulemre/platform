"""Validation Metadata — ownership, category, version, lifecycle, and provenance (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion

from platform_validation.model import ValidationCategory, ValidationLifecycle


@dataclass(frozen=True, slots=True)
class ValidationMetadata:
    """Immutable metadata for a validator/validation (auditable, versioned)."""

    validator_id: str
    category: ValidationCategory
    version: SchemaVersion
    lifecycle: ValidationLifecycle
    owner: str
    created_at: str  # supplied ISO-8601 (CS-3)
