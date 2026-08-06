"""Signal Model — the canonical signal aggregate and value objects (data only).

Reuses core_domain.signal.SignalSpec (declarative, net-of-cost). The signal references all upstream
evidence by identity for full traceability; it holds NO generation algorithm.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, Version
from core_domain.signal import SignalSpec

from signal_service.classification import SignalClassification
from signal_service.status import SignalStatus


class SignalPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True, slots=True)
class SignalIdentifier:
    """A stable, versioned identity for a signal (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class SignalEvidence:
    """Traceable evidence references for a signal (by identity, not computed).

    A signal is standardized only from validated features, experiment evidence, backtest results, and
    an APPROVED Risk assessment (mandatory, RS-1) — all referenced by identity (full traceability).
    """

    feature_ref: Ref        # -> feature_service (canonical feature source)
    experiment_ref: Ref     # -> experiment_service (canonical experiment source)
    backtest_ref: Ref       # -> backtesting_service (canonical performance evidence)
    risk_approval_ref: Ref  # -> risk_service approved assessment (mandatory approval, RS-1)


@dataclass(eq=False)
class Signal(AggregateRoot):
    """A standardized investment signal (aggregate root).

    Deterministic and net-of-cost (AD-1). It is NOT portfolio construction and NOT execution; it holds
    no generation algorithm. It never activates without a mandatory Risk approval (RS-1).
    """

    identifier: SignalIdentifier
    spec: SignalSpec  # declarative, net-of-cost (reused from core_domain.signal)
    classification: SignalClassification
    priority: SignalPriority
    evidence: SignalEvidence
    status: SignalStatus
    provenance: Provenance
