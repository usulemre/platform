"""Agent domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class AgentCertified(DomainEvent):
    """An agent passed the eval gate and was certified (REG-15, P4-01)."""

    agent_id: EntityId


@dataclass(frozen=True, slots=True)
class AgentSuspended(DomainEvent):
    """An agent was suspended (overreach/drift/incident/isolation breach) (REG-16)."""

    agent_id: EntityId


@dataclass(frozen=True, slots=True)
class AgentOutputRecorded(DomainEvent):
    """An advisory agent output was recorded with provenance (AI-8)."""

    agent_id: EntityId
    output_hash: str
