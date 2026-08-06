"""Configuration Policies — deterministic policy INTERFACES governing configuration (no logic)."""
from __future__ import annotations

from typing import Protocol

from platform_configuration.lifecycle import ConfigurationLifecycle
from platform_configuration.model import Configuration
from platform_configuration.scope import ConfigurationScope


class ConfigurationPolicy(Protocol):
    """Marker for a deterministic, versioned configuration policy."""

    ...


class SecretReferencePolicy(Protocol):
    """Rejects any inlined secret literal; secrets MUST be references (SEC-3, CODE-29). Interface only."""

    def has_literal_secret(self, configuration: Configuration) -> bool: ...


class ImmutabilityPolicy(Protocol):
    """An ACTIVE configuration is immutable; a change creates a new version (CP-2). Interface only."""

    def is_mutation_allowed(self, current: ConfigurationLifecycle) -> bool: ...


class ScopeOverridePolicy(Protocol):
    """Deterministically resolves the effective scope when scopes overlap (narrower wins). Interface only."""

    def effective_scope(self, scopes: tuple[ConfigurationScope, ...]) -> ConfigurationScope: ...
