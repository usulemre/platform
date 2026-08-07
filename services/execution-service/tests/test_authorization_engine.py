"""Golden-set tests for the Execution Authorization Engine (VS-1, CS-2).

Each test pins one constitutional guarantee of the final execution gate (RS-4, DEP-1, AI-1, RS-3,
HO-2, P3-15).
"""
from __future__ import annotations

import pytest
from core_domain.execution import AuthorizationToken, ExecutionMode
from core_domain.shared import ActorKind, ActorRef, Authority, KnowledgeTime, Ref, Timestamp
from execution_service.authorization.engine import (
    AuthorizationEvidence,
    AuthorizationRequest,
    ExecutionAuthorizationEngine,
)
from execution_service.errors import (
    AIExecutionAttempt,
    MissingRiskAuthority,
    ParityBreach,
    UnauthorizedExecution,
)

NOW = KnowledgeTime(at=Timestamp("2026-08-08T12:00:00Z"))
LATER = KnowledgeTime(at=Timestamp("2026-08-08T13:00:00Z"))
EARLIER = KnowledgeTime(at=Timestamp("2026-08-08T11:00:00Z"))

CLEARED = AuthorizationEvidence(validated=True, risk_signed_off=True, parity_clean=True)


def _actor(authority: Authority = Authority.APPROVE, kind: ActorKind = ActorKind.HUMAN) -> ActorRef:
    return ActorRef(id="human:cro", kind=kind, authority=authority)


def _token(expires: KnowledgeTime = LATER) -> AuthorizationToken:
    return AuthorizationToken(id="GAT-1", expires_at=expires)


def _request(**overrides: object) -> AuthorizationRequest:
    base: dict[str, object] = dict(
        execution=Ref(id="EXE-1", target="execution.Execution"),
        requested_mode=ExecutionMode.LIVE,
        authorizer=_actor(),
        now=NOW,
        evidence=CLEARED,
        token=_token(),
        counter_signed=True,
        kill_switch_engaged=False,
    )
    base.update(overrides)
    return AuthorizationRequest(**base)  # type: ignore[arg-type]


def _engine() -> ExecutionAuthorizationEngine:
    return ExecutionAuthorizationEngine()


# --- paper-first ------------------------------------------------------------


def test_paper_is_the_default_and_needs_no_token() -> None:
    """DEP-1: PAPER is permissive — granted without a governance token."""
    decision = _engine().authorize(
        _request(requested_mode=ExecutionMode.PAPER, token=None, counter_signed=False)
    )
    assert decision.mode is ExecutionMode.PAPER
    assert decision.authorization.token is None


# --- token-gated, time-boxed live -------------------------------------------


def test_live_granted_with_valid_token_and_full_clearances() -> None:
    decision = _engine().authorize(_request())
    assert decision.mode is ExecutionMode.LIVE
    assert decision.authorization.token is not None
    assert "RS-4" in decision.rationale


def test_live_without_token_fails_closed() -> None:
    """RS-4/FB-12: live is impossible without a governance token."""
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(token=None))


def test_live_with_expired_token_fails_closed() -> None:
    """RS-4: the token is time-boxed — an expired token authorizes nothing."""
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(token=_token(expires=EARLIER)))


def test_token_expiring_exactly_now_is_expired() -> None:
    """Boundary: now == expires_at is expired (fail closed)."""
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(token=_token(expires=NOW)))


def test_malformed_token_instant_fails_closed() -> None:
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(token=AuthorizationToken(id="GAT-x", expires_at=KnowledgeTime(at=Timestamp("not-a-date")))))


# --- no AI -------------------------------------------------------------------


def test_ai_actor_can_never_authorize() -> None:
    """AI-1/FB-1: an AI actor is rejected before any other consideration — even for paper."""
    ai = _actor(authority=Authority.PROPOSE, kind=ActorKind.AI_AGENT)
    with pytest.raises(AIExecutionAttempt):
        _engine().authorize(_request(requested_mode=ExecutionMode.PAPER, authorizer=ai))


# --- kill-switch dominates ---------------------------------------------------


def test_kill_switch_forces_halt_over_live() -> None:
    """RS-3/HO-4: an engaged kill-switch dominates a fully-cleared LIVE request."""
    decision = _engine().authorize(_request(kill_switch_engaged=True))
    assert decision.mode is ExecutionMode.HALT
    assert decision.authorization.token is None


# --- authority + counter-sign (HO-2) ----------------------------------------


def test_narrator_cannot_authorize() -> None:
    """AG-2: a narrates/proposes actor authorizes nothing, even paper."""
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(
            _request(requested_mode=ExecutionMode.PAPER, authorizer=_actor(authority=Authority.NARRATE))
        )


def test_live_requires_approve_authority() -> None:
    """HO-2: a DECIDE-only engine may not authorize capital-affecting live execution."""
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(authorizer=_actor(authority=Authority.DECIDE)))


def test_live_requires_counter_sign() -> None:
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(counter_signed=False))


# --- clearances are read, never re-adjudicated ------------------------------


def test_live_requires_validation() -> None:
    ev = AuthorizationEvidence(validated=False, risk_signed_off=True, parity_clean=True)
    with pytest.raises(UnauthorizedExecution):
        _engine().authorize(_request(evidence=ev))


def test_live_requires_risk_sign_off() -> None:
    """RS-1/2: missing independent Risk sign-off blocks live."""
    ev = AuthorizationEvidence(validated=True, risk_signed_off=False, parity_clean=True)
    with pytest.raises(MissingRiskAuthority):
        _engine().authorize(_request(evidence=ev))


def test_live_requires_clean_parity() -> None:
    """P3-15: a parity breach blocks live."""
    ev = AuthorizationEvidence(validated=True, risk_signed_off=True, parity_clean=False)
    with pytest.raises(ParityBreach):
        _engine().authorize(_request(evidence=ev))


# --- determinism -------------------------------------------------------------


def test_deterministic_same_request_same_decision() -> None:
    """DE-2: identical requests yield identical decisions across independent engines."""
    a = ExecutionAuthorizationEngine().authorize(_request())
    b = ExecutionAuthorizationEngine().authorize(_request())
    assert a.mode is b.mode
    assert a.authorization == b.authorization
    assert a.rationale == b.rationale
