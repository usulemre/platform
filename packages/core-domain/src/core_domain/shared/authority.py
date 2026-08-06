"""The authority spine as domain values: AI proposes/narrates, engines decide, humans approve."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Authority(Enum):
    """Authority ceiling of an actor (Architecture V2 §4; AI never holds DECIDE/APPROVE)."""

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
    """Who performed an action and the authority they hold (CP-5, HO-1)."""

    id: str
    kind: ActorKind
    authority: Authority
