"""Access Control — the access decision model and access-control INTERFACE (default-deny; deterministic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class AccessEffect(Enum):
    ALLOW = "allow"
    DENY = "deny"


@dataclass(frozen=True, slots=True)
class AccessDecision:
    """A deterministic, explainable access decision (default-deny, SEC-2; explainable, EXP-2)."""

    effect: AccessEffect
    rationale: str


class AccessControl(Protocol):
    """Deterministically decides access. Interface only.

    Access is default-deny and least-privilege (SEC-2); enforcement is deterministic, never AI-policed
    (AV2-25); every decision is auditable.
    """

    def is_allowed(self, principal: Id, resource: str, action: str) -> AccessDecision: ...
