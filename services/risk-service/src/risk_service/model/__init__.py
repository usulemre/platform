"""Risk Model — the canonical risk-assessment aggregate and value objects (data only).

Reuses core_domain.risk (RiskVerdict) for the deterministic verdict. It references performance
evidence (Backtesting Engine) and the subject under assessment by identity.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.risk import RiskVerdict
from core_domain.shared import AggregateRoot, Provenance, Ref, Version

from risk_service.classification import RiskClassification
from risk_service.constraints import RiskConstraint
from risk_service.limits import RiskLimit
from risk_service.status import RiskStatus


@dataclass(frozen=True, slots=True)
class RiskIdentifier:
    """A stable, versioned identity for a risk assessment (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class RiskProfile:
    """The deterministic risk profile: the constraints and limits applied to a subject."""

    constraints: tuple[RiskConstraint, ...]
    limits: tuple[RiskLimit, ...]


@dataclass(frozen=True, slots=True)
class RiskEvidence:
    """Performance evidence referenced from the Backtesting Engine (not computed here)."""

    summary: str
    backtest_ref: Ref  # -> backtesting_service result (canonical performance evidence)


@dataclass(frozen=True, slots=True)
class RiskDecision:
    """A deterministic risk verdict with an explainable rationale (RS-1, EXP-2).

    An LLM MUST NEVER decide risk (AI-1); the verdict is produced by a deterministic engine.
    """

    verdict: RiskVerdict
    rationale: str


@dataclass(eq=False)
class RiskAssessment(AggregateRoot):
    """A risk assessment of a research output (aggregate root).

    Independent of research/portfolio (RS-2, CP-5); deterministic; it gates progression to signal
    generation but holds NO execution authority.
    """

    identifier: RiskIdentifier
    subject: Ref  # -> the research output (signal candidate / strategy) under assessment
    evidence: RiskEvidence
    profile: RiskProfile
    classification: RiskClassification
    decision: RiskDecision | None  # None until the deterministic engine decides
    status: RiskStatus
    provenance: Provenance
