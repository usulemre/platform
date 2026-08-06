"""Authority as contract-level enums (mirrors the authority spine; independent of the domain)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AuthorityLevel(Enum):
    PROPOSE = "propose"
    NARRATE = "narrate"
    DECIDE = "decide"
    APPROVE = "approve"


class ActorKind(Enum):
    HUMAN = "human"
    DETERMINISTIC_ENGINE = "deterministic_engine"
    AI_AGENT = "ai_agent"


@dataclass(frozen=True, slots=True)
class ActorRef:
    """Who issued a message and the authority they hold (CP-5, HO-1). AI is never DECIDE/APPROVE."""

    id: str
    kind: ActorKind
    authority: AuthorityLevel
