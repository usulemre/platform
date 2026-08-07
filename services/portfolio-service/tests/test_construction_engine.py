"""Golden-set tests for the Portfolio Construction Engine (VS-1, CS-2, PS-1..4)."""
from __future__ import annotations

import pytest
from core_domain.governance import CapitalEligibilityToken
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
from portfolio_service.errors import (
    AIAllocationDecision,
    ConstraintViolation,
    GrossOptimization,
    IneligibleAlpha,
)
from portfolio_service.optimization.engine import (
    ConstructionConstraints,
    ConstructionRequest,
    EligibleCandidate,
    PortfolioConstructionEngine,
)

ENGINE_ACTOR = ActorRef(id="engine:portfolio", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)
PROVENANCE = Provenance(
    produced_by=ENGINE_ACTOR,
    artifact_class=ArtifactClass.DETERMINISTIC,
    lineage=LineageRef(id="LIN-1"),
    run_manifest=None,
)


def _strategy(sid: str) -> Ref:
    return Ref(id=sid, target="strategy.Strategy")


def _token(sid: str) -> CapitalEligibilityToken:
    return CapitalEligibilityToken(
        id=f"CET-{sid}", subject=_strategy(sid), issued_at=KnowledgeTime(at=Timestamp("2026-08-08T00:00:00Z"))
    )


def _candidate(sid: str, score: float, *, net_of_cost: bool = True, token_for: str | None = None) -> EligibleCandidate:
    tok = None if token_for == "NONE" else _token(token_for or sid)
    return EligibleCandidate(strategy=_strategy(sid), token=tok, net_of_cost_score=score, net_of_cost=net_of_cost)


def _request(candidates: tuple[EligibleCandidate, ...], max_weight: float = 1.0, **kw: object) -> ConstructionRequest:
    base: dict[str, object] = dict(
        candidates=candidates,
        constraints=ConstructionConstraints(max_weight=max_weight),
        constructor=ENGINE_ACTOR,
        rationale="equal-ish alpha-proportional allocation",
        provenance=PROVENANCE,
    )
    base.update(kw)
    return ConstructionRequest(**base)  # type: ignore[arg-type]


def _engine() -> PortfolioConstructionEngine:
    return PortfolioConstructionEngine()


# --- PS-2: net-of-cost proportional sizing ----------------------------------


def test_weights_are_alpha_proportional_and_sum_to_one() -> None:
    cands = (_candidate("A", 3.0), _candidate("B", 1.0))
    pf = _engine().construct(_request(cands))
    by = {a.strategy.id: a.weight.value for a in pf.allocations}
    assert by["A"] == pytest.approx(0.75)
    assert by["B"] == pytest.approx(0.25)
    assert sum(a.weight.value for a in pf.allocations) == pytest.approx(1.0)


def test_max_weight_cap_redistributes_excess() -> None:
    """PS-2: water-filling caps a dominant alpha and redistributes to the rest."""
    cands = (_candidate("A", 100.0), _candidate("B", 1.0), _candidate("C", 1.0))
    pf = _engine().construct(_request(cands, max_weight=0.5))
    by = {a.strategy.id: a.weight.value for a in pf.allocations}
    assert by["A"] == pytest.approx(0.5)  # capped
    assert by["B"] == pytest.approx(0.25)  # (1-0.5) split evenly
    assert by["C"] == pytest.approx(0.25)
    assert sum(by.values()) == pytest.approx(1.0)


def test_infeasible_cap_fails_closed() -> None:
    """PS-2: max_weight too small to reach full investment is a constraint violation."""
    cands = (_candidate("A", 1.0), _candidate("B", 1.0))
    with pytest.raises(ConstraintViolation):
        _engine().construct(_request(cands, max_weight=0.4))  # 0.4*2 < 1


def test_long_only_drops_non_positive_alpha() -> None:
    cands = (_candidate("A", 2.0), _candidate("B", -1.0))
    pf = _engine().construct(_request(cands))
    ids = {a.strategy.id for a in pf.allocations}
    assert ids == {"A"}
    assert pf.allocations[0].weight.value == pytest.approx(1.0)


def test_all_non_positive_fails_closed() -> None:
    cands = (_candidate("A", -2.0), _candidate("B", 0.0))
    with pytest.raises(ConstraintViolation):
        _engine().construct(_request(cands))


# --- PS-1: eligibility, never re-adjudicated --------------------------------


def test_missing_token_is_ineligible() -> None:
    cands = (_candidate("A", 1.0, token_for="NONE"),)
    with pytest.raises(IneligibleAlpha):
        _engine().construct(_request(cands))


def test_token_for_another_subject_is_ineligible() -> None:
    """PS-1: capital-eligibility tokens are non-transferable."""
    cands = (_candidate("A", 1.0, token_for="B"),)  # token certifies B, not A
    with pytest.raises(IneligibleAlpha):
        _engine().construct(_request(cands))


# --- PS-2: gross prohibited -------------------------------------------------


def test_gross_score_is_rejected() -> None:
    cands = (_candidate("A", 1.0, net_of_cost=False),)
    with pytest.raises(GrossOptimization):
        _engine().construct(_request(cands))


# --- PS-3: no AI sizing -----------------------------------------------------


def test_ai_constructor_is_rejected() -> None:
    ai = ActorRef(id="ai:x", kind=ActorKind.AI_AGENT, authority=Authority.PROPOSE)
    with pytest.raises(AIAllocationDecision):
        _engine().construct(_request((_candidate("A", 1.0),), constructor=ai))


# --- PS-4: immutable, content-addressed snapshot ----------------------------


def test_snapshot_is_content_addressed_and_deterministic() -> None:
    """PS-4/NM-2: identical inputs -> identical portfolio id + snapshot digest."""
    cands = (_candidate("A", 3.0), _candidate("B", 1.0))
    a = _engine().construct(_request(cands))
    b = _engine().construct(_request(cands))
    assert a.id == b.id
    assert a.snapshot == b.snapshot
    assert a.id.value.startswith("PF-")
    assert a.snapshot.algorithm == "sha256"


def test_snapshot_is_order_independent() -> None:
    a = _engine().construct(_request((_candidate("A", 3.0), _candidate("B", 1.0))))
    b = _engine().construct(_request((_candidate("B", 1.0), _candidate("A", 3.0))))
    assert a.snapshot == b.snapshot  # canonical form sorts positions


def test_different_weights_change_the_snapshot() -> None:
    a = _engine().construct(_request((_candidate("A", 3.0), _candidate("B", 1.0))))
    b = _engine().construct(_request((_candidate("A", 1.0), _candidate("B", 1.0))))
    assert a.snapshot != b.snapshot
