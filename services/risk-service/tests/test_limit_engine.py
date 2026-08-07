"""Golden-set tests for the Risk Limit Engine + Kill-Switch (VS-1, CS-2).

Each test pins one constitutional guarantee of the deterministic risk authority (RS-1..3, CP-5,
HO-3, HO-4, AI-1/4).
"""
from __future__ import annotations

import pytest
from core_domain.risk import (
    AIHaltAttempt,
    Exposure,
    KillSwitchState,
    RiskLimit,
    RiskVerdict,
)
from core_domain.shared import ActorKind, ActorRef, Authority, Ref
from risk_service.errors import AIRiskDecision, GovernanceBypass, RiskIndependenceViolation
from risk_service.limits.engine import (
    UNMEASURED,
    DeterministicKillSwitch,
    RiskEvaluation,
    RiskLimitEngine,
    RiskOverride,
)

SUBJECT = Ref(id="PF-1", target="portfolio.Portfolio")
RISK = ActorRef(id="engine:risk", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)
QUANT = ActorRef(id="human:quant", kind=ActorKind.HUMAN, authority=Authority.PROPOSE)

LIMITS = (
    RiskLimit(name="gross_leverage", threshold=2.0),
    RiskLimit(name="concentration", threshold=0.10),
)


def _eval(exposures: tuple[Exposure, ...], **overrides: object) -> RiskEvaluation:
    base: dict[str, object] = dict(
        subject=SUBJECT, producer=QUANT, assessor=RISK, limits=LIMITS, exposures=exposures, override=None
    )
    base.update(overrides)
    return RiskEvaluation(**base)  # type: ignore[arg-type]


def _within() -> tuple[Exposure, ...]:
    return (Exposure(name="gross_leverage", value=1.5), Exposure(name="concentration", value=0.08))


def test_within_limits_signs_off() -> None:
    """RS-1: all exposures under their ceilings -> WITHIN_LIMITS and a risk sign-off for Execution."""
    decision = RiskLimitEngine().evaluate(_eval(_within()))
    assert decision.verdict is RiskVerdict.WITHIN_LIMITS
    assert decision.signed_off is True
    assert decision.breaches == ()


def test_breach_blocks_sign_off() -> None:
    exposures = (Exposure(name="gross_leverage", value=3.0), Exposure(name="concentration", value=0.08))
    decision = RiskLimitEngine().evaluate(_eval(exposures))
    assert decision.verdict is RiskVerdict.BREACH
    assert decision.signed_off is False
    assert decision.breaches[0].limit.name == "gross_leverage"
    assert decision.breaches[0].observed == 3.0


def test_unmeasured_limit_fails_closed() -> None:
    """RS-1: a limit with no matching exposure cannot be cleared -> breach (fail closed)."""
    exposures = (Exposure(name="gross_leverage", value=1.5),)  # concentration missing
    decision = RiskLimitEngine().evaluate(_eval(exposures))
    assert decision.verdict is RiskVerdict.BREACH
    assert decision.breaches[0].limit.name == "concentration"
    assert decision.breaches[0].observed == UNMEASURED


def test_boundary_at_threshold_is_within_limits() -> None:
    """observed == threshold is within limits (breach requires strictly exceeding)."""
    exposures = (Exposure(name="gross_leverage", value=2.0), Exposure(name="concentration", value=0.10))
    assert RiskLimitEngine().evaluate(_eval(exposures)).verdict is RiskVerdict.WITHIN_LIMITS


def test_ai_assessor_is_rejected() -> None:
    """AI-1/RS-1: an AI actor may never decide a risk verdict."""
    ai = ActorRef(id="ai:risk", kind=ActorKind.AI_AGENT, authority=Authority.PROPOSE)
    with pytest.raises(AIRiskDecision):
        RiskLimitEngine().evaluate(_eval(_within(), assessor=ai))


def test_non_independent_assessor_is_rejected() -> None:
    """RS-2/CP-5: the risk assessor may not be the subject's producer."""
    same = ActorRef(id="engine:risk", kind=ActorKind.HUMAN, authority=Authority.DECIDE)
    with pytest.raises(RiskIndependenceViolation):
        RiskLimitEngine().evaluate(_eval(_within(), producer=same, assessor=RISK))


def test_override_cannot_bypass_a_hard_breach() -> None:
    """HO-3: a human override against a hard breach is void."""
    exposures = (Exposure(name="gross_leverage", value=5.0), Exposure(name="concentration", value=0.08))
    override = RiskOverride(
        approver=ActorRef(id="human:cro", kind=ActorKind.HUMAN, authority=Authority.APPROVE),
        rationale="trust me",
    )
    with pytest.raises(GovernanceBypass):
        RiskLimitEngine().evaluate(_eval(exposures, override=override))


def test_ai_override_is_rejected() -> None:
    override = RiskOverride(
        approver=ActorRef(id="ai:x", kind=ActorKind.AI_AGENT, authority=Authority.PROPOSE),
        rationale="",
    )
    with pytest.raises(AIRiskDecision):
        RiskLimitEngine().evaluate(_eval(_within(), override=override))


def test_deterministic_same_inputs_same_verdict() -> None:
    """DE-2: identical inputs yield identical verdicts and breach sets."""
    a = RiskLimitEngine().evaluate(_eval(_within()))
    b = RiskLimitEngine().evaluate(_eval(_within()))
    assert a == b


# --- kill-switch ------------------------------------------------------------


def test_kill_switch_starts_armed() -> None:
    ks = DeterministicKillSwitch()
    assert ks.state is KillSwitchState.ARMED
    assert ks.engaged is False


def test_human_engages_kill_switch() -> None:
    """RS-3: a human forces the halt; state becomes ENGAGED (idempotent)."""
    ks = DeterministicKillSwitch()
    human = ActorRef(id="human:cro", kind=ActorKind.HUMAN, authority=Authority.APPROVE)
    ks.engage(human)
    ks.engage(human)  # idempotent
    assert ks.engaged is True


def test_ai_cannot_engage_kill_switch() -> None:
    """HO-4/RS-3: the kill-switch is never AI-gated."""
    ks = DeterministicKillSwitch()
    ai = ActorRef(id="ai:x", kind=ActorKind.AI_AGENT, authority=Authority.PROPOSE)
    with pytest.raises(AIHaltAttempt):
        ks.engage(ai)
    assert ks.engaged is False
