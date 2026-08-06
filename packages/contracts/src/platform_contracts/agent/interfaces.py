"""Agent registry, model-registry, and policy contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import AgentRegistrationDto, ModelPinDto, RegisterAgent, RegisterAgentResponse


class AgentRegistryPortContract(Protocol):
    """Deterministic registry; agents cannot edit their own entry (REG-22)."""

    def get(self, id: Id) -> AgentRegistrationDto: ...
    def register(self, command: RegisterAgent) -> RegisterAgentResponse: ...


class ModelRegistryPortContract(Protocol):
    """Only pinned models may run (AI-6, P4-01)."""

    def is_pinned(self, model: ModelPinDto) -> bool: ...


class AgentAuthorityPolicyContract(Protocol):
    """Enforces propose/narrate ceilings; never decide (AI-1..4, REG-9)."""

    def is_permitted(self, agent_id: Id, action: str) -> bool: ...


class IsolationPolicyContract(Protocol):
    """Enforces the generator-vs-validator air-gap (P2-07)."""

    def may_access(self, agent_id: Id, resource: str) -> bool: ...
