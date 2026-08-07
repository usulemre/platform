"""Golden-set tests for the Signal Lifecycle Engine (VS-1, CS-2, AD-1/3, RL-2, RS-1, P2-07)."""
from __future__ import annotations

import pytest
from core_domain.shared import ActorKind, ActorRef, Authority
from signal_service.errors import (
    GeneratorObservedValidation,
    GrossSignalSelection,
    IllegalSignalTransition,
    MLSignalDecision,
    SignalMissingRiskApproval,
)
from signal_service.lifecycle import SignalLifecycle as L
from signal_service.lifecycle.engine import SignalLifecycleEngine, SignalTransition

HUMAN = ActorRef(id="human:quant", kind=ActorKind.HUMAN, authority=Authority.DECIDE)
ENGINE = ActorRef(id="engine:signal", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)


def _t(current: L, to: L, **kw: object) -> SignalTransition:
    base: dict[str, object] = dict(current=current, to=to, actor=ENGINE)
    base.update(kw)
    return SignalTransition(**base)  # type: ignore[arg-type]


def _engine() -> SignalLifecycleEngine:
    return SignalLifecycleEngine()


# --- state machine ----------------------------------------------------------


def test_canonical_transition_advances() -> None:
    assert _engine().transition(_t(L.PROPOSED, L.GENERATED)) is L.GENERATED


def test_non_canonical_transition_fails_closed() -> None:
    with pytest.raises(IllegalSignalTransition):
        _engine().transition(_t(L.PROPOSED, L.ACTIVE))


def test_terminal_state_is_a_dead_end() -> None:
    """RL-2: a retired signal transitions nowhere; re-opening needs a new version."""
    with pytest.raises(IllegalSignalTransition):
        _engine().transition(_t(L.RETIRED, L.ACTIVE))


# --- isolation barrier (P2-07 / AD-3) ---------------------------------------


def test_generator_observing_validation_is_rejected() -> None:
    """P2-07/AP-3: the generator↔validation air-gap is inviolable."""
    with pytest.raises(GeneratorObservedValidation):
        _engine().transition(_t(L.PROPOSED, L.GENERATED, generator_observed_validation=True))


# --- net-of-cost (AD-1) -----------------------------------------------------


def test_gross_signal_rejected_at_generation() -> None:
    with pytest.raises(GrossSignalSelection):
        _engine().transition(_t(L.PROPOSED, L.GENERATED, net_of_cost=False))


# --- validation + risk gates ------------------------------------------------


def test_approval_requires_cleared_validation() -> None:
    with pytest.raises(IllegalSignalTransition):
        _engine().transition(_t(L.VALIDATING, L.APPROVED, validation_passed=False))


def test_approval_with_validation_passes() -> None:
    assert _engine().transition(_t(L.VALIDATING, L.APPROVED, validation_passed=True)) is L.APPROVED


def test_activation_requires_risk_approval() -> None:
    """RS-1: no signal goes ACTIVE without an independent Risk approval."""
    with pytest.raises(SignalMissingRiskApproval):
        _engine().transition(_t(L.APPROVED, L.ACTIVE, risk_approved=False))


def test_activation_with_risk_approval_passes() -> None:
    assert _engine().transition(_t(L.APPROVED, L.ACTIVE, risk_approved=True)) is L.ACTIVE


# --- no AI -------------------------------------------------------------------


def test_ai_actor_cannot_transition() -> None:
    """AI-1/DE-1: an AI/ML actor may never decide a signal transition."""
    ai = ActorRef(id="ai:x", kind=ActorKind.AI_AGENT, authority=Authority.PROPOSE)
    with pytest.raises(MLSignalDecision):
        _engine().transition(_t(L.PROPOSED, L.GENERATED, actor=ai))


# --- determinism ------------------------------------------------------------


def test_deterministic() -> None:
    a = _engine().transition(_t(L.APPROVED, L.ACTIVE, risk_approved=True))
    b = _engine().transition(_t(L.APPROVED, L.ACTIVE, risk_approved=True))
    assert a is b
