"""Risk Limit Engine + Kill-Switch — the deterministic risk authority (RS-1..3, CP-5, HO-3).

The seventh deterministic engine in the platform. Risk oversight is where trading is made safe: it
is deterministic, versioned and formally testable (RS-1), independent of research and portfolio
construction (RS-2, CP-5), and no AI may ever decide a verdict or a halt (AI-1, RS-1). Its clean
verdict is the ``risk_signed_off`` clearance the Execution Authorization Engine reads before LIVE.

Two hard controls live here:

* **RiskLimitEngine** — evaluates measured exposures against versioned hard limits and returns an
  immutable verdict. Every limit must be *measured*; an unmeasured limit cannot be cleared and fails
  closed to a breach (RS-1). A human override that tries to pass a hard breach is void
  (``GovernanceBypass``, HO-3), and an AI override/assessment is rejected (``AIRiskDecision``, AI-1/4).
  Independence is enforced by construction: the assessor may not be the actor that produced the
  subject (``RiskIndependenceViolation``, RS-2/CP-5).
* **DeterministicKillSwitch** — the human-invocable circuit breaker that forces execution to
  paper/halt (RS-3, ARCH §2.10). It is *never* AI-gated (HO-4): an AI attempt to engage it raises
  ``AIHaltAttempt``. Its ``engaged`` state is exactly what the Execution gate consumes to force HALT.

Deterministic (DE-2): same exposures + limits ⇒ same verdict and same breach set. No wall-clock,
randomness or I/O is read (CS-3).
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.risk import (
    AIHaltAttempt,
    Exposure,
    KillSwitchState,
    LimitBreach,
    RiskLimit,
    RiskVerdict,
)
from core_domain.shared import ActorKind, ActorRef, Ref

from risk_service.errors import AIRiskDecision, GovernanceBypass, RiskIndependenceViolation

#: Sentinel recorded for a limit with no matching exposure: it cannot be proven within-limits, so it
#: is treated as an (unbounded) breach — the safe direction (RS-1, fail closed).
UNMEASURED = float("inf")


@dataclass(frozen=True, slots=True)
class RiskOverride:
    """A human override presented at the risk gate. Void if it bypasses a hard breach (HO-3)."""

    approver: ActorRef
    rationale: str


@dataclass(frozen=True, slots=True)
class RiskEvaluation:
    """One risk-evaluation request. ``producer`` is who produced the subject (research/portfolio);
    ``assessor`` is the independent risk authority running the gate (non-AI, RS-2/CP-5)."""

    subject: Ref  # -> portfolio.Portfolio / strategy.Strategy
    producer: ActorRef
    assessor: ActorRef
    limits: tuple[RiskLimit, ...]
    exposures: tuple[Exposure, ...]
    override: RiskOverride | None = None


@dataclass(frozen=True, slots=True)
class RiskDecision:
    """The immutable outcome of the risk gate. ``signed_off`` is the clearance Execution reads."""

    subject: Ref
    verdict: RiskVerdict
    breaches: tuple[LimitBreach, ...]
    signed_off: bool


class RiskLimitEngine:
    """The deterministic Risk Limit Engine (RS-1). Fulfils the intent of
    ``core_domain.risk.RiskLimitEngine``, taking measured exposures explicitly so it re-runs no
    upstream analytics — it adjudicates limits, it does not compute risk (separation of powers)."""

    def evaluate(self, evaluation: RiskEvaluation) -> RiskDecision:
        self._check_assessor(evaluation.assessor, evaluation.producer)
        breaches = self._breaches(evaluation.limits, evaluation.exposures)
        if evaluation.override is not None:
            self._reject_illegal_override(evaluation.override, breaches)
        verdict = RiskVerdict.WITHIN_LIMITS if not breaches else RiskVerdict.BREACH
        return RiskDecision(
            subject=evaluation.subject,
            verdict=verdict,
            breaches=breaches,
            signed_off=not breaches,
        )

    # ---- checks -----------------------------------------------------------------------------

    @staticmethod
    def _check_assessor(assessor: ActorRef, producer: ActorRef) -> None:
        # AI-1/RS-1: an AI actor may never decide a risk verdict.
        if assessor.kind is ActorKind.AI_AGENT:
            raise AIRiskDecision("an AI actor may not decide a risk verdict (RS-1, AI-1)")
        # RS-2/CP-5: risk oversight must be independent of the actor that produced the subject.
        if assessor.id == producer.id:
            raise RiskIndependenceViolation(
                "the risk assessor may not be the subject's producer (RS-2, CP-5)"
            )

    @staticmethod
    def _breaches(
        limits: tuple[RiskLimit, ...], exposures: tuple[Exposure, ...]
    ) -> tuple[LimitBreach, ...]:
        measured = {e.name: e.value for e in exposures}
        breaches: list[LimitBreach] = []
        for limit in limits:
            observed = measured.get(limit.name, UNMEASURED)
            if observed > limit.threshold:  # every hard limit is a ceiling: observed must not exceed
                breaches.append(LimitBreach(limit=limit, observed=observed))
        return tuple(breaches)

    @staticmethod
    def _reject_illegal_override(override: RiskOverride, breaches: tuple[LimitBreach, ...]) -> None:
        # AI-4: an AI may never override a risk control.
        if override.approver.kind is ActorKind.AI_AGENT:
            raise AIRiskDecision("an AI actor may not override a risk control (AI-4)")
        # HO-3: an override cannot buy passage past a hard breach; it is void.
        if breaches:
            raise GovernanceBypass(
                "an override cannot bypass a hard risk-limit breach (HO-3); it is void"
            )


class DeterministicKillSwitch:
    """The human-invocable kill-switch (RS-3, ARCH §2.10, HO-4). Never AI-gated."""

    __slots__ = ("_state",)

    def __init__(self) -> None:
        self._state = KillSwitchState.ARMED

    @property
    def state(self) -> KillSwitchState:
        return self._state

    @property
    def engaged(self) -> bool:
        """Exactly the flag the Execution Authorization Engine reads to force HALT."""
        return self._state is KillSwitchState.ENGAGED

    def engage(self, invoked_by: ActorRef) -> None:
        # HO-4/RS-3: kill-switch authority is always available to humans and NEVER gated by AI.
        if invoked_by.kind is ActorKind.AI_AGENT:
            raise AIHaltAttempt("an AI actor may not engage the kill-switch (HO-4, RS-3)")
        self._state = KillSwitchState.ENGAGED  # idempotent: engaging an engaged switch is a no-op


__all__ = [
    "UNMEASURED",
    "DeterministicKillSwitch",
    "RiskDecision",
    "RiskEvaluation",
    "RiskLimitEngine",
    "RiskOverride",
]
