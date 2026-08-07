"""Golden-set tests for the Pre-Capital Scientific Governance Gate (VS-1, CS-2, P2-09)."""
from __future__ import annotations

import dataclasses

import pytest
from core_domain.governance import (
    AIOverrideAttempt,
    ControlBypassOverride,
    Override,
    Rationale,
    UnauthorizedApproval,
)
from core_domain.shared import (
    ActorKind,
    ActorRef,
    Authority,
    EntityId,
    KnowledgeTime,
    Ref,
    Timestamp,
)
from governance_service.scientific_gate import (
    GovernanceSubmission,
    ScientificClearances,
    ScientificGovernanceGate,
)

_HUMAN = ActorRef("dr-quant", ActorKind.HUMAN, Authority.APPROVE)
_AI = ActorRef("agent-7", ActorKind.AI_AGENT, Authority.PROPOSE)
_SUBJECT = Ref(id="strategy:momentum-1", target="strategy.Strategy")
_WHEN = KnowledgeTime(Timestamp("2024-06-01T00:00:00Z"))


def _clearances(**overrides: bool) -> ScientificClearances:
    base = dict(
        multiple_testing_compliant=True,
        leakage_cleared=True,
        purged_embargoed_cv=True,
        holdout_evaluated_once=True,
        independently_replicated=True,
        economic_rationale_evaluated=True,
    )
    base.update(overrides)
    return ScientificClearances(**base)


def _submission(clearances: ScientificClearances, *, adjudicator: ActorRef = _HUMAN, override: Override | None = None) -> GovernanceSubmission:
    return GovernanceSubmission(
        subject=_SUBJECT, clearances=clearances, adjudicator=adjudicator, issued_at=_WHEN, override=override
    )


def _override(approver: ActorRef = _HUMAN) -> Override:
    return Override(id=EntityId("OVR-1"), subject=_SUBJECT, approver=approver, rationale=Rationale("force it"))


def test_all_clearances_met_issues_token() -> None:
    decision = ScientificGovernanceGate().adjudicate(_submission(_clearances()))
    assert decision.granted is True
    assert decision.unmet == ()
    assert decision.token is not None
    assert decision.token.subject == _SUBJECT
    assert decision.token.id.startswith("CET-")


def test_unmet_clearance_withholds_token() -> None:
    decision = ScientificGovernanceGate().adjudicate(_submission(_clearances(leakage_cleared=False)))
    assert decision.granted is False
    assert decision.token is None
    assert "leakage_cleared" in decision.unmet


def test_override_cannot_bypass_statistical_failure() -> None:
    """HO-3: a human override against an unmet statistical control is void."""
    with pytest.raises(ControlBypassOverride):
        ScientificGovernanceGate().adjudicate(
            _submission(_clearances(multiple_testing_compliant=False), override=_override())
        )


def test_override_against_non_statistical_gap_still_withholds() -> None:
    """An override may accompany a missing economic rationale (not statistical) but earns no token."""
    decision = ScientificGovernanceGate().adjudicate(
        _submission(_clearances(economic_rationale_evaluated=False), override=_override())
    )
    assert decision.granted is False
    assert decision.unmet == ("economic_rationale_evaluated",)


def test_ai_may_not_adjudicate() -> None:
    with pytest.raises(UnauthorizedApproval):
        ScientificGovernanceGate().adjudicate(_submission(_clearances(), adjudicator=_AI))


def test_insufficient_authority_may_not_adjudicate() -> None:
    proposer = ActorRef("intern", ActorKind.HUMAN, Authority.PROPOSE)
    with pytest.raises(UnauthorizedApproval):
        ScientificGovernanceGate().adjudicate(_submission(_clearances(), adjudicator=proposer))


def test_ai_override_is_rejected() -> None:
    with pytest.raises(AIOverrideAttempt):
        ScientificGovernanceGate().adjudicate(
            _submission(_clearances(leakage_cleared=False), override=_override(approver=_AI))
        )


def test_token_id_is_deterministic() -> None:
    gate = ScientificGovernanceGate()
    a = gate.adjudicate(_submission(_clearances()))
    b = gate.adjudicate(_submission(_clearances()))
    assert a.token is not None and b.token is not None
    assert a.token.id == b.token.id
    # A different subject yields a different token id.
    other = dataclasses.replace(_SUBJECT, id="strategy:other")
    c = gate.adjudicate(
        GovernanceSubmission(subject=other, clearances=_clearances(), adjudicator=_HUMAN, issued_at=_WHEN)
    )
    assert c.token is not None and c.token.id != a.token.id
