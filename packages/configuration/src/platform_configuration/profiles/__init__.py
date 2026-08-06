"""Configuration Profiles — named environment/deployment profiles (data only; no env parsing)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import SchemaVersion

from platform_configuration.scope import ConfigurationScope


class ProfileKind(Enum):
    ENVIRONMENT = "environment"  # e.g. development / staging / production
    DEPLOYMENT = "deployment"
    LOCAL = "local"


@dataclass(frozen=True, slots=True)
class ConfigurationProfile:
    """A named profile selecting configuration for an environment/deployment.

    Environment separation is expressed by profile; NO environment variable parsing happens here
    (that is the concrete loader's job) — this is a declarative selector only (DEP-1).
    """

    name: str
    kind: ProfileKind
    scope: ConfigurationScope
    version: SchemaVersion
