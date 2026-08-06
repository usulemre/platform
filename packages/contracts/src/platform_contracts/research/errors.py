"""Research error contracts."""
from __future__ import annotations

from enum import Enum


class ResearchErrorCode(Enum):
    PRE_REGISTRATION_LOCKED = "research.pre_registration_locked"  # p-hacking (FB-8)
    NOT_FALSIFIABLE = "research.not_falsifiable"                  # SM-1
    UNREGISTERED_IDEA = "research.unregistered_idea"
