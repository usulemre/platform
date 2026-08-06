"""Configuration Schema — the declarative schema a configuration is validated against (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import SchemaVersion


class FieldType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    ENUM = "enum"
    SECRET_REF = "secret_ref"  # a reference to a secret; the value is never inlined (SEC-3)
    LIST = "list"
    MAP = "map"
    DURATION = "duration"


@dataclass(frozen=True, slots=True)
class Constraint:
    """A named constraint on a field; evaluated by an outer validator (no logic here)."""

    name: str
    expression: str


@dataclass(frozen=True, slots=True)
class FieldSpec:
    """The declarative specification of one configuration field."""

    key: str
    type: FieldType
    required: bool
    secret: bool  # if True, the field MUST be a secret reference, never a literal (SEC-3)
    constraints: tuple[Constraint, ...]


@dataclass(frozen=True, slots=True)
class ConfigurationSchema:
    """An immutable, versioned schema for a configuration."""

    name: str
    version: SchemaVersion
    fields: tuple[FieldSpec, ...]
