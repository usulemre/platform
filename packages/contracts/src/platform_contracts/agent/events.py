"""Agent event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class AgentCertified(Event):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class AgentSuspended(Event):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class AgentOutputRecorded(Event):
    agent_id: Id
    output_hash: str
