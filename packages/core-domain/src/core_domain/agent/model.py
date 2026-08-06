"""Agent domain model — registered, contract-bound, advisory-only AI agents (definitions only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Authority, Provenance

# --- Value Objects ---------------------------------------------------------


@dataclass(frozen=True, slots=True)
class AgentId:
    """Stable registry identifier of the form AGT-<CAT>-<nnn> (REG-8)."""

    value: str


class TrustLevel(Enum):
    U = "U"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"  # only T2/T3 operate in production (AIGOV-12)


class RegistryState(Enum):
    PROPOSED = "proposed"
    REVIEWED = "reviewed"
    CERTIFIED = "certified"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    RETIRED = "retired"


@dataclass(frozen=True, slots=True)
class ModelPin:
    """A pinned model binding; use of an unpinned/'latest' model is PROHIBITED (AI-6, P4-01)."""

    model_id: str
    version: str


@dataclass(frozen=True, slots=True)
class PromptVersion:
    """A versioned prompt artifact with a recorded hash (PE-1)."""

    version: str
    prompt_hash: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class AgentRegistration(AggregateRoot):
    """An agent's registry entry (aggregate root); authority is propose/narrate, never decide."""

    agent_id: AgentId
    authority: Authority  # MUST be PROPOSE or NARRATE (REG-9)
    trust: TrustLevel
    state: RegistryState
    model: ModelPin
    prompt: PromptVersion


@dataclass(frozen=True, slots=True)
class AgentOutput:
    """An advisory agent output, recorded with provenance; never a decision (AI-8, APR-2)."""

    provenance: Provenance
    summary: str
