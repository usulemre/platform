"""Configuration Scope — the institutional scopes and their precedence (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ConfigurationScope(Enum):
    """The institutional configuration scopes (broad to narrow)."""

    GLOBAL = "global"
    PLATFORM = "platform"
    APPLICATION = "application"
    SERVICE = "service"
    WORKFLOW = "workflow"
    AGENT = "agent"
    EXPERIMENT = "experiment"
    DATASET = "dataset"
    ENVIRONMENT = "environment"
    DEPLOYMENT = "deployment"
    LOCAL = "local"


#: Precedence order (broad -> narrow). A NARROWER scope overrides a broader one deterministically.
SCOPE_PRECEDENCE: tuple[ConfigurationScope, ...] = (
    ConfigurationScope.GLOBAL,
    ConfigurationScope.PLATFORM,
    ConfigurationScope.APPLICATION,
    ConfigurationScope.SERVICE,
    ConfigurationScope.WORKFLOW,
    ConfigurationScope.AGENT,
    ConfigurationScope.EXPERIMENT,
    ConfigurationScope.DATASET,
    ConfigurationScope.ENVIRONMENT,
    ConfigurationScope.DEPLOYMENT,
    ConfigurationScope.LOCAL,
)


@dataclass(frozen=True, slots=True)
class ScopeSelector:
    """Selects a concrete instance of a scope (e.g. scope=SERVICE, selector='dataset-service')."""

    scope: ConfigurationScope
    selector: str
