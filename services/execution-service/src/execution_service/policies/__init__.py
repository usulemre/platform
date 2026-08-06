"""Execution Policies — deterministic execution-governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Version


@dataclass(frozen=True, slots=True)
class ExecutionPolicy:
    """A named, versioned, deterministic execution policy (RB-14). Immutable; a change is a new version."""

    name: str
    version: Version
    description: str


class PaperFirstPolicy(Protocol):
    """The default execution mode is paper/shadow (DEP-1). Interface only."""

    def is_paper_by_default(self, execution: EntityId) -> bool: ...


class TokenGatedLivePolicy(Protocol):
    """Live execution is impossible without a valid, time-boxed governance token (RS-4). Interface only."""

    def has_valid_token(self, execution: EntityId) -> bool: ...


class DeterministicExecutionPolicy(Protocol):
    """Execution is deterministic; an LLM MUST NEVER execute or authorize (AI-1). Interface only."""

    def is_deterministic(self, execution: EntityId) -> bool: ...


class PlansOnlyPolicy(Protocol):
    """The engine produces plans only; it never submits orders or connects to brokers/exchanges. Interface only."""

    def is_plans_only(self, execution: EntityId) -> bool: ...


class ReversibilityPolicy(Protocol):
    """A deployment/plan is reversible; irreversible deployment is PROHIBITED (DEP-3). Interface only."""

    def is_reversible(self, execution: EntityId) -> bool: ...


class KillSwitchPolicy(Protocol):
    """The kill-switch forces HALT/paper; human-invocable, never AI-gated (RS-3). Interface only."""

    def can_force_halt(self, execution: EntityId) -> bool: ...
