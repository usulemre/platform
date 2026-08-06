"""Portfolio Model — the canonical portfolio aggregate, candidate, and value objects (data only).

A portfolio is an immutable, content-addressed snapshot with rationale (PS-4). It references its
constituent eligible signals and risk approval by identity; it holds no optimization algorithm.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.portfolio import PortfolioRationale
from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Ref, Version

from portfolio_service.allocation import PortfolioAllocation
from portfolio_service.status import PortfolioStatus


class DecisionVerdict(Enum):
    CONSTRUCT = "construct"
    REJECT = "reject"


@dataclass(frozen=True, slots=True)
class PortfolioIdentifier:
    """A stable, versioned identity for a portfolio (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class PortfolioEvidence:
    """Traceable evidence references (by identity, not computed).

    ``signal_refs`` are capital-eligible signals (PS-1); ``risk_ref`` is the mandatory risk source (RS-1).
    """

    signal_refs: tuple[Ref, ...]
    risk_ref: Ref


@dataclass(frozen=True, slots=True)
class PortfolioDecision:
    """A deterministic decision with an explainable rationale (EXP-2). No AI decides (AI-1)."""

    verdict: DecisionVerdict
    rationale: str


@dataclass(frozen=True, slots=True)
class PortfolioSummary:
    """A compact, immutable summary of a portfolio (references, not computed statistics)."""

    position_count: int
    gross_exposure_ref: str
    net_exposure_ref: str


@dataclass(frozen=True, slots=True)
class PortfolioCandidate:
    """A governed portfolio candidate: the allocation proposed for validation/review (immutable)."""

    identifier: PortfolioIdentifier
    allocation: PortfolioAllocation
    evidence: PortfolioEvidence
    rationale: PortfolioRationale


@dataclass(eq=False)
class Portfolio(AggregateRoot):
    """A portfolio (aggregate root): an immutable, content-addressed snapshot with rationale (PS-4).

    Constructed deterministically from capital-eligible signals within risk constraints (PS-1/2). It
    is NOT execution; it holds no optimization algorithm.
    """

    identifier: PortfolioIdentifier
    snapshot: ContentAddress
    allocation: PortfolioAllocation
    evidence: PortfolioEvidence
    rationale: PortfolioRationale
    status: PortfolioStatus
    provenance: Provenance
