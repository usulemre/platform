"""Agent registry, model-registry, and authority-policy interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import AgentRegistration, ModelPin


class AgentRegistryPort(Protocol):
    """Interface to the deterministic Agent Registry; agents cannot edit their own entry (REG-22)."""

    def get(self, id: EntityId) -> AgentRegistration: ...
    def add(self, registration: AgentRegistration) -> None: ...


class ModelRegistryPort(Protocol):
    """Interface to the Model Registry; only pinned models may run (AI-6, P4-01)."""

    def is_pinned(self, model: ModelPin) -> bool: ...


class AgentAuthorityPolicy(Protocol):
    """Interface: deterministic policy enforcing propose/narrate ceilings (AI-1..4, REG-9)."""

    def is_permitted(self, agent: EntityId, action: str) -> bool: ...


class IsolationPolicy(Protocol):
    """Interface: deterministic policy enforcing the generator-vs-validator air-gap (P2-07)."""

    def may_access(self, agent: EntityId, resource: str) -> bool: ...
