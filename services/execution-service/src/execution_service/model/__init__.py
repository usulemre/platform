"""Execution Model — the canonical execution aggregate and value objects (data only).

An execution binds approved portfolio + risk + parity evidence and a Run Manifest (reproducibility).
It produces plans only; it holds no broker/exchange/order-routing logic.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, RunManifestRef, Version

from execution_service.status import ExecutionStatus


class DecisionVerdict(Enum):
    AUTHORIZE = "authorize"
    REJECT = "reject"


@dataclass(frozen=True, slots=True)
class ExecutionIdentifier:
    """A stable, versioned identity for an execution (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ExecutionEvidence:
    """Traceable evidence references (by identity, not computed).

    ``portfolio_ref`` is the approved portfolio (Portfolio Engine); ``risk_ref`` the risk authority
    (Risk Engine); ``parity_ref`` the research-to-production parity check (P3-15).
    """

    portfolio_ref: Ref
    risk_ref: Ref
    parity_ref: Ref


@dataclass(frozen=True, slots=True)
class ExecutionDecision:
    """A deterministic decision with an explainable rationale (EXP-2). No AI decides (AI-1)."""

    verdict: DecisionVerdict
    rationale: str


@dataclass(frozen=True, slots=True)
class ExecutionSummary:
    """A compact, immutable summary of an execution (references, not computed statistics)."""

    instruction_count: int
    mode: str


@dataclass(eq=False)
class Execution(AggregateRoot):
    """An execution planning/authorization aggregate (aggregate root).

    The final deterministic authority BEFORE any external adapter. It produces PLANS only, is paper-first
    (DEP-1), and is reversible (DEP-3); it binds a Run Manifest for reproducibility (RP-1). It is NOT
    broker/exchange/order routing and NEVER submits production orders.
    """

    identifier: ExecutionIdentifier
    evidence: ExecutionEvidence
    status: ExecutionStatus
    manifest: RunManifestRef
    provenance: Provenance
