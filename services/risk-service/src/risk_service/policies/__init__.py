"""Risk Policies — the versioned risk policy model and governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Version


@dataclass(frozen=True, slots=True)
class RiskPolicy:
    """A named, versioned, deterministic risk policy (RB-13). Immutable; a change is a new version."""

    name: str
    version: Version
    description: str


class RiskPolicyService(Protocol):
    """Governs risk-policy revisions (recorded, versioned). Interface only; a revision triggers reassessment."""

    def update_policy(self, policy: RiskPolicy) -> None: ...


class IndependencePolicy(Protocol):
    """Risk oversight is independent of research/portfolio (RS-2, CP-5). Interface only."""

    def is_independent(self, assessment: EntityId) -> bool: ...


class DeterministicDecisionPolicy(Protocol):
    """Risk verdicts are deterministic; an LLM MUST NEVER decide risk (RS-1, AI-1). Interface only."""

    def is_deterministic(self, assessment: EntityId) -> bool: ...


class NoExecutionAuthorityPolicy(Protocol):
    """The Risk Engine gates but NEVER executes or authorizes execution (boundary). Interface only."""

    def has_no_execution_authority(self, assessment: EntityId) -> bool: ...
