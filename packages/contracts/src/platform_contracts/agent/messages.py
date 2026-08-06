"""Agent contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import AuthorityLevel, Command, Dto, Id, Query, Response


class TrustLevel(Enum):
    U = "U"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"


@dataclass(frozen=True, slots=True)
class ModelPinDto(Dto):
    model_id: str
    version: str  # unpinned/'latest' is PROHIBITED (AI-6)


@dataclass(frozen=True, slots=True)
class AgentRegistrationDto(Dto):
    id: Id
    authority: AuthorityLevel  # MUST be PROPOSE or NARRATE (REG-9)
    trust: TrustLevel
    model: ModelPinDto


@dataclass(frozen=True, slots=True)
class RegisterAgent(Command):
    registration: AgentRegistrationDto


@dataclass(frozen=True, slots=True)
class CertifyAgent(Command):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class SuspendAgent(Command):
    agent_id: Id
    reason: str


@dataclass(frozen=True, slots=True)
class RecordAgentOutput(Command):
    """Advisory output recorded with provenance; never a decision (AI-8, APR-2)."""

    agent_id: Id
    output_hash: str


@dataclass(frozen=True, slots=True)
class GetAgentRegistration(Query):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class RegisterAgentResponse(Response):
    agent_id: Id
