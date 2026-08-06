"""Agent bounded context — registered, contract-bound, advisory-only AI agents."""
from __future__ import annotations

from .contracts import AgentAuthorityPolicy, AgentRegistryPort, IsolationPolicy, ModelRegistryPort
from .errors import DecideAuthorityForbidden, SelfEscalation, UnpinnedModel, UnregisteredAgent
from .events import AgentCertified, AgentOutputRecorded, AgentSuspended
from .model import (
    AgentId,
    AgentOutput,
    AgentRegistration,
    ModelPin,
    PromptVersion,
    RegistryState,
    TrustLevel,
)

__all__ = [
    "AgentId", "TrustLevel", "RegistryState", "ModelPin", "PromptVersion",
    "AgentRegistration", "AgentOutput",
    "AgentCertified", "AgentSuspended", "AgentOutputRecorded",
    "AgentRegistryPort", "ModelRegistryPort", "AgentAuthorityPolicy", "IsolationPolicy",
    "DecideAuthorityForbidden", "SelfEscalation", "UnpinnedModel", "UnregisteredAgent",
]
