"""Configuration Metadata — ownership, scope, version, lifecycle, and schema reference (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion

from platform_configuration.lifecycle import ConfigurationLifecycle
from platform_configuration.scope import ConfigurationScope


@dataclass(frozen=True, slots=True)
class ConfigurationMetadata:
    """Immutable metadata for a configuration: who owns it, its scope, version, lifecycle, schema."""

    name: str
    owner: str            # named accountable role (CP-7)
    description: str
    scope: ConfigurationScope
    version: SchemaVersion
    lifecycle: ConfigurationLifecycle
    schema_ref: str       # reference to the ConfigurationSchema by name
