"""Identity Core — the canonical principal and identity types (user/service/agent; authority spine)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import ActorKind, Authority

from platform_security.lifecycle import IdentityStatus


class IdentityType(Enum):
    """The canonical identity types on the platform."""

    HUMAN_USER = "human_user"
    AI_AGENT = "ai_agent"
    INTERNAL_SERVICE = "internal_service"
    WORKFLOW_ENGINE = "workflow_engine"
    SCHEDULER = "scheduler"
    SYSTEM_ADMINISTRATOR = "system_administrator"
    MONITORING_COMPONENT = "monitoring_component"


@dataclass(frozen=True, slots=True)
class IdentityIdentifier:
    """A stable, immutable identity reference."""

    value: str


@dataclass(frozen=True, slots=True)
class Principal:
    """A canonical security principal (any authenticated identity).

    ``kind`` maps to the authority spine actor kind (human / deterministic engine / AI agent).
    """

    identifier: IdentityIdentifier
    identity_type: IdentityType
    kind: ActorKind
    status: IdentityStatus


@dataclass(frozen=True, slots=True)
class UserIdentity:
    """A human user identity. Named humans are accountable for consequential outcomes (HO-1)."""

    principal: Principal
    role_refs: tuple[str, ...]
    accountable: bool


@dataclass(frozen=True, slots=True)
class ServiceIdentity:
    """An internal service (workload) identity, referenced by workload id (SPIFFE, per TDR)."""

    principal: Principal
    workload_id: str


@dataclass(frozen=True, slots=True)
class AgentIdentity:
    """An AI agent identity.

    Its ``authority`` is a ceiling of ``PROPOSE`` or ``NARRATE`` — an AI agent NEVER holds ``DECIDE``
    or ``APPROVE`` (AI-1..4). Model pinning / eval are governed by the Agent Registry (referenced).
    """

    principal: Principal
    authority: Authority
    agent_registry_ref: str
