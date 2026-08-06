"""Governance domain model — human approvals, tokens, overrides, and the tamper-evident audit."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import ActorRef, AggregateRoot, KnowledgeTime, Ref

# --- Value Objects ---------------------------------------------------------


class ApprovalDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class Rationale:
    """The written rationale required for an override/approval (HO-2)."""

    text: str


@dataclass(frozen=True, slots=True)
class CounterSignature:
    """An independent counter-signature required for capital-affecting approvals (HO-2)."""

    signer: ActorRef


@dataclass(frozen=True, slots=True)
class CapitalEligibilityToken:
    """The canonical governance artifact certifying scientific eligibility (P2-09).

    Issued by the scientific gate; referenced by Strategy/Portfolio.
    """

    id: str
    subject: Ref  # -> strategy.Strategy
    issued_at: KnowledgeTime


@dataclass(frozen=True, slots=True)
class AuditChainEntry:
    """A hash-chained, tamper-evident audit record (SEC-4, CP-7)."""

    prev_hash: str
    entry_hash: str
    actor: ActorRef


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Approval(AggregateRoot):
    """A recorded human approval at a governance gate (aggregate root, HO-2)."""

    subject: Ref
    decision: ApprovalDecision
    approver: ActorRef
    counter_signature: CounterSignature | None
    rationale: Rationale


@dataclass(eq=False)
class Override(AggregateRoot):
    """A recorded human override; MUST NOT bypass statistical/risk controls (HO-3)."""

    subject: Ref
    approver: ActorRef
    rationale: Rationale
