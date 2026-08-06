"""Research Model — the canonical research initiative model (data only).

Reuses the core research domain (core_domain.research) for the falsifiable prediction and economic
rationale; adds the initiative-level aggregate that the Research Service governs.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.research import EconomicRationale, FalsifiablePrediction
from core_domain.shared import AggregateRoot, Provenance, Ref, Version

from research_service.classification import ResearchClassification
from research_service.ownership import ResearchOwner
from research_service.status import ResearchStatus


class ResearchPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True, slots=True)
class ResearchIdentifier:
    """A stable, versioned identity for a research initiative (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ResearchObjective:
    """The falsifiable objective and its economic rationale (AD-2, SM-1)."""

    statement: str
    rationale: EconomicRationale


@dataclass(frozen=True, slots=True)
class ResearchHypothesis:
    """The initiative's hypothesis; references the core domain Hypothesis by identity (SE-2)."""

    hypothesis_ref: Ref  # -> core_domain.research.Hypothesis
    prediction: FalsifiablePrediction


@dataclass(frozen=True, slots=True)
class ResearchEvidence:
    """Descriptive evidence supporting or refuting the hypothesis.

    Negative results are first-class and preserved (SM-4); this is a record, not an adjudication.
    """

    summary: str
    supports: bool


@dataclass(frozen=True, slots=True)
class ResearchReference:
    """A literature or prior-art reference (provenance for a proposal)."""

    citation: str
    uri: str | None


@dataclass(eq=False)
class Research(AggregateRoot):
    """A research initiative (aggregate root).

    It proposes and records; it does NOT adjudicate significance/acceptance (CP-5) and it does NOT
    observe validation/OOS outcomes (the isolation barrier, AD-3, P2-07).
    """

    identifier: ResearchIdentifier
    objective: ResearchObjective
    hypothesis: ResearchHypothesis | None
    classification: ResearchClassification
    owner: ResearchOwner
    priority: ResearchPriority
    status: ResearchStatus
    provenance: Provenance
