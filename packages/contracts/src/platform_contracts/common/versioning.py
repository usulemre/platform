"""Contract versioning primitives (VER-1/2: breaking changes bump major)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SchemaVersion:
    """Semantic version of a contract schema."""

    major: int
    minor: int
    patch: int
