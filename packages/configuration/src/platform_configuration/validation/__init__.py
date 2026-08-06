"""Configuration Validation — the validation result, error definitions, and validator interface.

STRUCTURAL validation only (schema/constraints); never statistical (AI-2). No loading/parsing here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_configuration.model import Configuration
from platform_configuration.schema import ConfigurationSchema


class ConfigurationErrorCode(Enum):
    SCHEMA_VIOLATION = "config.schema_violation"
    MISSING_REQUIRED = "config.missing_required"
    LITERAL_SECRET = "config.literal_secret"          # a secret was inlined (SEC-3, FB-14)
    UNKNOWN_KEY = "config.unknown_key"
    INVALID_TRANSITION = "config.invalid_transition"  # lifecycle transition not allowed
    INCOMPATIBLE_VERSION = "config.incompatible_version"


@dataclass(frozen=True, slots=True)
class ConfigurationError:
    """A structured, immutable configuration error (a fact, not an exception)."""

    code: ConfigurationErrorCode
    key: str
    message: str


@dataclass(frozen=True, slots=True)
class ConfigurationViolation:
    """A single structural violation of a configuration against its schema."""

    key: str
    rule: str
    detail: str


@dataclass(frozen=True, slots=True)
class ConfigurationValidationResult:
    """The immutable outcome of validating a configuration against its schema."""

    valid: bool
    violations: tuple[ConfigurationViolation, ...]


class ConfigurationValidator(Protocol):
    """Validates a Configuration against a ConfigurationSchema. Interface only — no logic here."""

    def validate(
        self, configuration: Configuration, schema: ConfigurationSchema
    ) -> ConfigurationValidationResult: ...
