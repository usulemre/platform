"""Configuration Model — the immutable configuration, entries, and the secrets-by-reference value."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import VersionTag

from platform_configuration.metadata import ConfigurationMetadata
from platform_configuration.scope import ConfigurationScope


class ValueKind(Enum):
    LITERAL = "literal"
    SECRET_REF = "secret_ref"


@dataclass(frozen=True, slots=True)
class SecretRef:
    """A reference to a secret held by the secrets broker.

    The secret VALUE is NEVER stored here or anywhere in the repository/artifacts (SEC-3, CODE-29,
    FB-14). ``broker_path`` is only a reference resolved at runtime by the broker (OpenBao, per TDR).
    """

    broker_path: str


@dataclass(frozen=True, slots=True)
class ConfigValue:
    """A configuration value: a non-secret literal OR a secret reference — never a secret literal."""

    kind: ValueKind
    literal: str | None       # populated only for non-secret LITERAL values
    secret_ref: SecretRef | None  # populated only for SECRET_REF values


@dataclass(frozen=True, slots=True)
class ConfigKey:
    """A dotted configuration key path."""

    path: str


@dataclass(frozen=True, slots=True)
class ConfigEntry:
    """A single key/value pair within a configuration."""

    key: ConfigKey
    value: ConfigValue


@dataclass(frozen=True, slots=True)
class Configuration:
    """An immutable, versioned configuration for a scope (a set of entries + metadata).

    An ACTIVE configuration is never mutated; a change creates a new version (CP-2).
    """

    config_id: VersionTag
    scope: ConfigurationScope
    entries: tuple[ConfigEntry, ...]
    metadata: ConfigurationMetadata
