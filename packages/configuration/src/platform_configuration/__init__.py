"""platform_configuration — the technology-independent configuration abstractions.

Defines HOW configuration is represented, scoped, validated, versioned, and governed across the
platform. Secrets are held ONLY as references (never values, SEC-3, CODE-29); an ACTIVE
configuration is immutable and superseded by a new version (CP-2); configuration is deterministic
(no ambient reads, CS-3) and auditable.

Boundaries: no loading, no environment parsing, no secret storage, no persistence, no infrastructure,
no business logic. The concrete loader and secrets broker (OpenBao, per the TDR) plug in behind
these interfaces.

Modules: model, schema, metadata, validation, policies, versioning, scope, profiles, lifecycle,
registry.
"""
from __future__ import annotations

from . import (
    lifecycle,
    metadata,
    model,
    policies,
    profiles,
    registry,
    schema,
    scope,
    validation,
    versioning,
)

__all__ = [
    "model", "schema", "metadata", "validation", "policies", "versioning", "scope", "profiles",
    "lifecycle", "registry",
]
__version__ = "0.1.0"
