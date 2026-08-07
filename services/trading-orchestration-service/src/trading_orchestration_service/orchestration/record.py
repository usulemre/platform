"""The immutable, content-addressed audit artifact of one trading-chain run (CP-7, OB-1, EXP-2).

The ``TradingDecisionRecord`` answers the platform's quality-bar questions from deterministic inputs
alone: which portfolio was evaluated, what risk checks were applied, whether parity was clean, why
execution was approved or rejected, and in which mode. It is content-addressed (SHA-256 of its
canonical stages) so the whole decision is reproducible and diffable (DE-2, NM-2).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from enum import Enum

from core_domain.execution import ExecutionMode
from core_domain.shared import Ref

_SEP = "\x1f"


class TradingStage(Enum):
    """The ordered gates of the trading chain (the run stops at the first failing gate)."""

    KILL_SWITCH = "kill_switch"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    PARITY = "parity"
    EXECUTION = "execution"


class TradingOutcome(Enum):
    """The single terminal outcome of a trading-chain run."""

    APPROVED_LIVE = "approved_live"
    APPROVED_PAPER = "approved_paper"
    HALTED = "halted"
    REJECTED_INELIGIBLE = "rejected_ineligible"  # portfolio construction failed closed
    REJECTED_RISK = "rejected_risk"
    REJECTED_PARITY = "rejected_parity"
    UNAUTHORIZED = "unauthorized"  # execution gate refused (token/counter-sign/validation)


#: Outcomes that permit an execution instruction to be produced (paper or live).
_APPROVED = frozenset({TradingOutcome.APPROVED_LIVE, TradingOutcome.APPROVED_PAPER})


@dataclass(frozen=True, slots=True)
class StageOutcome:
    """One gate's immutable result: passed/failed, an explainable detail, and machine reason codes."""

    stage: TradingStage
    passed: bool
    detail: str  # human-readable explanation (EXP-2)
    reasons: tuple[str, ...] = ()  # machine reason codes (breached limits, worst parity offender, ...)


@dataclass(frozen=True, slots=True)
class TradingDecisionRecord:
    """The immutable outcome of a trading-chain run — the audit trail for one decision (CP-7)."""

    record_id: str
    outcome: TradingOutcome
    final_mode: ExecutionMode | None
    portfolio_ref: Ref | None
    stages: tuple[StageOutcome, ...]

    @property
    def approved(self) -> bool:
        return self.outcome in _APPROVED


def build_record(
    outcome: TradingOutcome,
    final_mode: ExecutionMode | None,
    portfolio_ref: Ref | None,
    stages: tuple[StageOutcome, ...],
) -> TradingDecisionRecord:
    """Assemble a content-addressed ``TradingDecisionRecord`` (deterministic; DE-2, NM-2)."""
    canonical = _SEP.join(
        (
            outcome.value,
            final_mode.value if final_mode is not None else "-",
            portfolio_ref.id if portfolio_ref is not None else "-",
            *(
                f"{s.stage.value}={int(s.passed)}:{s.detail}:{'|'.join(s.reasons)}"
                for s in stages
            ),
        )
    )
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return TradingDecisionRecord(
        record_id=f"TDR-{digest[:16]}",
        outcome=outcome,
        final_mode=final_mode,
        portfolio_ref=portfolio_ref,
        stages=stages,
    )


__all__ = [
    "StageOutcome",
    "TradingDecisionRecord",
    "TradingOutcome",
    "TradingStage",
    "build_record",
]
