"""Opaque identity references carried across contract boundaries (never domain objects, SE-2)."""
from __future__ import annotations

from dataclasses import dataclass

from .versioning import SchemaVersion


@dataclass(frozen=True, slots=True)
class Id:
    """An opaque identity reference to an aggregate in some bounded context."""

    value: str


@dataclass(frozen=True, slots=True)
class VersionTag:
    """A name + version that immutably denotes one artifact version (NM-2, VER-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class ContentHash:
    """Content-addressed reference to an immutable artifact (CP-2, P1-02)."""

    algorithm: str
    digest: str


@dataclass(frozen=True, slots=True)
class CorrelationId:
    """Correlates messages across a workflow/run for traceability (CP-7)."""

    value: str
