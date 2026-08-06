"""Configuration Versioning — configuration version identity and compatibility policy (VER-1/2)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import SchemaVersion


class Compatibility(Enum):
    NONE = "none"
    BACKWARD = "backward"
    FORWARD = "forward"
    FULL = "full"


@dataclass(frozen=True, slots=True)
class ConfigurationVersion:
    """The immutable version identity of a configuration (a breaking change bumps major, VER-1)."""

    config_name: str
    version: SchemaVersion
    supersedes: str | None
    compatibility: Compatibility


class VersioningPolicy(Protocol):
    """Governs configuration evolution; historical versions remain interpretable (VER-2). Interface only."""

    def is_compatible(self, current: ConfigurationVersion, candidate: ConfigurationVersion) -> bool: ...
