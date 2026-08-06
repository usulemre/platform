"""Admin Responses — the canonical administrative response models (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from admin_api.core import AdminStatus, ApiMetadata


@dataclass(frozen=True, slots=True)
class AuditResponse:
    """A response carrying references to tamper-evident audit records (no internal details)."""

    meta: ApiMetadata
    status: AdminStatus
    record_refs: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class HealthResponse:
    """A response carrying component health summaries (component -> health)."""

    meta: ApiMetadata
    status: AdminStatus
    components: tuple[tuple[str, str], ...]


@dataclass(frozen=True, slots=True)
class ConfigurationResponse:
    """A response carrying configuration references (secrets by reference only, SEC-3)."""

    meta: ApiMetadata
    status: AdminStatus
    config_refs: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class PermissionResponse:
    """A response carrying permission references."""

    meta: ApiMetadata
    status: AdminStatus
    permissions: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RoleResponse:
    """A response carrying role references."""

    meta: ApiMetadata
    status: AdminStatus
    roles: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RegistryResponse:
    """A response carrying registry entry references (any of the six registries + agent registry)."""

    meta: ApiMetadata
    status: AdminStatus
    entries: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class WorkflowResponse:
    """A response carrying a triggered workflow instance reference."""

    meta: ApiMetadata
    status: AdminStatus
    instance_ref: str


@dataclass(frozen=True, slots=True)
class AgentResponse:
    """A response carrying an agent reference and its authority ceiling (propose/narrate, never decide)."""

    meta: ApiMetadata
    status: AdminStatus
    agent_ref: str
    authority: str
