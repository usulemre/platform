"""Integration tests for the trading chain: Portfolio -> Risk -> Parity -> Execution (VS-1, CS-2).

Unlike the per-engine golden tests, these exercise the engines *composed*: each test drives the whole
``TradingPipeline`` and pins one end-to-end outcome, verifying that one engine's output actually
flows into the next and that the chain fails closed at the first failing gate (§18, §20).
"""
from __future__ import annotations

from core_domain.execution import AuthorizationToken, ExecutionMode
from core_domain.governance import CapitalEligibilityToken
from core_domain.risk import Exposure, RiskLimit
from core_domain.shared import (
    ActorKind,
    ActorRef,
    Authority,
    KnowledgeTime,
    Provenance,
    Ref,
    Timestamp,
)
from core_domain.shared.provenance import ArtifactClass, LineageRef
from execution_service.parity import ParityObservation, ParitySpec
from portfolio_service.optimization.engine import ConstructionConstraints, EligibleCandidate
from trading_orchestration_service.orchestration.pipeline import (
    TradingPipeline,
    TradingPipelineRequest,
)
from trading_orchestration_service.orchestration.record import TradingOutcome, TradingStage

# --- actors -----------------------------------------------------------------
PORTFOLIO_ENGINE = ActorRef(id="engine:portfolio", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)
RISK_ENGINE = ActorRef(id="engine:risk", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)
QUANT = ActorRef(id="human:quant", kind=ActorKind.HUMAN, authority=Authority.PROPOSE)
CRO = ActorRef(id="human:cro", kind=ActorKind.HUMAN, authority=Authority.APPROVE)

NOW = KnowledgeTime(at=Timestamp("2026-08-08T12:00:00Z"))
TOKEN_VALID = AuthorizationToken(id="GAT-1", expires_at=KnowledgeTime(at=Timestamp("2026-08-08T13:00:00Z")))
PROVENANCE = Provenance(
    produced_by=PORTFOLIO_ENGINE,
    artifact_class=ArtifactClass.DETERMINISTIC,
    lineage=LineageRef(id="LIN-1"),
    run_manifest=None,
)


def _strategy(sid: str) -> Ref:
    return Ref(id=sid, target="strategy.Strategy")


def _candidate(sid: str, score: float) -> EligibleCandidate:
    token = CapitalEligibilityToken(id=f"CET-{sid}", subject=_strategy(sid), issued_at=NOW)
    return EligibleCandidate(strategy=_strategy(sid), token=token, net_of_cost_score=score, net_of_cost=True)


def _request(**overrides: object) -> TradingPipelineRequest:
    base: dict[str, object] = dict(
        candidates=(_candidate("A", 3.0), _candidate("B", 1.0)),
        constraints=ConstructionConstraints(max_weight=1.0),
        constructor=PORTFOLIO_ENGINE,
        portfolio_rationale="alpha-proportional",
        provenance=PROVENANCE,
        # risk: exposures well within limits
        risk_limits=(RiskLimit(name="gross_leverage", threshold=2.0),),
        exposures=(Exposure(name="gross_leverage", value=1.0),),
        risk_producer=QUANT,
        risk_assessor=RISK_ENGINE,
        # parity: clean
        parity_spec=ParitySpec(tolerance=0.05),
        parity_observations=(ParityObservation("sig_a", 100.0, 100.0),),
        # execution: fully cleared LIVE
        requested_mode=ExecutionMode.LIVE,
        authorizer=CRO,
        now=NOW,
        validated=True,
        token=TOKEN_VALID,
        counter_signed=True,
        kill_switch_engaged=False,
    )
    base.update(overrides)
    return TradingPipelineRequest(**base)  # type: ignore[arg-type]


def _pipeline() -> TradingPipeline:
    return TradingPipeline()


def _stage(record, stage: TradingStage):  # type: ignore[no-untyped-def]
    return next((s for s in record.stages if s.stage is stage), None)


# --- happy path -------------------------------------------------------------


def test_full_chain_approves_live() -> None:
    """Eligible alphas, within limits, parity clean, valid token -> APPROVED_LIVE end to end."""
    record = _pipeline().run(_request())
    assert record.outcome is TradingOutcome.APPROVED_LIVE
    assert record.final_mode is ExecutionMode.LIVE
    assert record.approved is True
    assert record.portfolio_ref is not None and record.portfolio_ref.id.startswith("PF-")
    # every gate ran and passed, in order
    assert [s.stage for s in record.stages] == [
        TradingStage.PORTFOLIO,
        TradingStage.RISK,
        TradingStage.PARITY,
        TradingStage.EXECUTION,
    ]
    assert all(s.passed for s in record.stages)


def test_paper_path_needs_no_token() -> None:
    record = _pipeline().run(_request(requested_mode=ExecutionMode.PAPER, token=None, counter_signed=False))
    assert record.outcome is TradingOutcome.APPROVED_PAPER
    assert record.final_mode is ExecutionMode.PAPER


# --- fail closed at the first failing gate ----------------------------------


def test_risk_breach_stops_before_execution() -> None:
    """A risk breach threads through: chain stops at RISK, execution never runs (§20 fail-closed)."""
    record = _pipeline().run(
        _request(exposures=(Exposure(name="gross_leverage", value=5.0),))
    )
    assert record.outcome is TradingOutcome.REJECTED_RISK
    assert record.final_mode is None
    assert "gross_leverage" in _stage(record, TradingStage.RISK).reasons
    assert _stage(record, TradingStage.EXECUTION) is None  # never reached


def test_parity_breach_stops_before_execution() -> None:
    record = _pipeline().run(
        _request(parity_observations=(ParityObservation("sig_a", 100.0, 200.0),))
    )
    assert record.outcome is TradingOutcome.REJECTED_PARITY
    assert _stage(record, TradingStage.PARITY).passed is False
    assert _stage(record, TradingStage.EXECUTION) is None


def test_kill_switch_halts_before_any_engine() -> None:
    """RS-3: an engaged kill-switch short-circuits the whole chain to HALTED."""
    record = _pipeline().run(_request(kill_switch_engaged=True))
    assert record.outcome is TradingOutcome.HALTED
    assert record.final_mode is ExecutionMode.HALT
    assert [s.stage for s in record.stages] == [TradingStage.KILL_SWITCH]
    assert record.portfolio_ref is None


def test_missing_token_live_is_unauthorized() -> None:
    """Risk + parity clear, but LIVE without a token is refused at the execution gate."""
    record = _pipeline().run(_request(token=None))
    assert record.outcome is TradingOutcome.UNAUTHORIZED
    assert _stage(record, TradingStage.RISK).passed is True
    assert _stage(record, TradingStage.PARITY).passed is True
    assert _stage(record, TradingStage.EXECUTION).passed is False


def test_expired_token_live_is_unauthorized() -> None:
    expired = AuthorizationToken(id="GAT-x", expires_at=KnowledgeTime(at=Timestamp("2026-08-08T11:00:00Z")))
    record = _pipeline().run(_request(token=expired))
    assert record.outcome is TradingOutcome.UNAUTHORIZED


def test_ineligible_alpha_fails_closed_at_construction() -> None:
    """PS-1: a candidate without a capital-eligibility token stops the chain at PORTFOLIO."""
    bad = EligibleCandidate(strategy=_strategy("Z"), token=None, net_of_cost_score=1.0, net_of_cost=True)
    record = _pipeline().run(_request(candidates=(bad,)))
    assert record.outcome is TradingOutcome.REJECTED_INELIGIBLE
    assert record.portfolio_ref is None
    assert _stage(record, TradingStage.PORTFOLIO).passed is False
    assert "IneligibleAlpha" in _stage(record, TradingStage.PORTFOLIO).reasons


def test_ai_authorizer_is_rejected_at_execution() -> None:
    """AI-1: an AI authorizer is refused; risk/parity still recorded as passed."""
    ai = ActorRef(id="ai:x", kind=ActorKind.AI_AGENT, authority=Authority.PROPOSE)
    record = _pipeline().run(_request(authorizer=ai))
    assert record.outcome is TradingOutcome.UNAUTHORIZED
    assert "AIExecutionAttempt" in _stage(record, TradingStage.EXECUTION).reasons


# --- determinism ------------------------------------------------------------


def test_identical_request_yields_identical_record_id() -> None:
    """DE-2: the whole decision is content-addressed and reproducible."""
    a = _pipeline().run(_request())
    b = _pipeline().run(_request())
    assert a.record_id == b.record_id
    assert a.record_id.startswith("TDR-")


def test_different_outcomes_have_different_record_ids() -> None:
    approved = _pipeline().run(_request())
    rejected = _pipeline().run(_request(exposures=(Exposure(name="gross_leverage", value=9.0),)))
    assert approved.record_id != rejected.record_id
