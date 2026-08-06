"""Dataset Schema — the declarative dataset schema and governed schema evolution (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import SchemaVersion


class FieldType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    TIMESTAMP = "timestamp"
    DECIMAL = "decimal"
    CATEGORY = "category"


@dataclass(frozen=True, slots=True)
class SchemaField:
    """One declarative field of a dataset schema."""

    name: str
    type: FieldType
    nullable: bool


@dataclass(frozen=True, slots=True)
class DatasetSchema:
    """An immutable, versioned dataset schema."""

    name: str
    version: SchemaVersion
    fields: tuple[SchemaField, ...]


class SchemaEvolutionKind(Enum):
    ADD_OPTIONAL_FIELD = "add_optional_field"
    DEPRECATE_FIELD = "deprecate_field"
    WIDEN_TYPE = "widen_type"
    DROP_FIELD = "drop_field"          # breaking
    NARROW_TYPE = "narrow_type"        # breaking


@dataclass(frozen=True, slots=True)
class SchemaEvolution:
    """A governed schema change; breaking changes bump the major version and preserve history (VER-2)."""

    from_version: SchemaVersion
    to_version: SchemaVersion
    kind: SchemaEvolutionKind
    backward_compatible: bool
