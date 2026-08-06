"""Agent error contracts."""
from __future__ import annotations

from enum import Enum


class AgentErrorCode(Enum):
    DECIDE_AUTHORITY_FORBIDDEN = "agent.decide_forbidden"  # REG-9, AI-1..4
    SELF_ESCALATION = "agent.self_escalation"              # REG-22/23
    UNPINNED_MODEL = "agent.unpinned_model"                # AI-6
    UNREGISTERED_AGENT = "agent.unregistered"              # REG-1
