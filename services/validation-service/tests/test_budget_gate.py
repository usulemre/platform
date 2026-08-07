"""Golden-set tests for the Multiple-Testing Budget Gate (VS-1, CS-2).

Each test pins one constitutional guarantee of the deterministic budget gate (P2-02, SI-1..SI-3,
AP-2, FB-8).
"""
from __future__ import annotations

import math

import pytest
from core_domain.shared import Ref
from core_domain.validation import UndeflatedSignificance, Verdict
from validation_service.budget import (
    DEFLATED_P_VALUE,
    BudgetDecision,
    BudgetPolicy,
    BudgetSubmission,
    BudgetViolation,
    MultipleTestingBudgetGate,
    TrialAccounting,
)


def _subject(sid: str = "FCT-1") -> Ref:
    return Ref(id=sid, target="factor.Factor")


def _gate(alpha: float = 0.05) -> MultipleTestingBudgetGate:
    return MultipleTestingBudgetGate(BudgetPolicy(alpha=alpha))


def _submit(p: float, n: int, rho: float) -> BudgetSubmission:
    return BudgetSubmission(
        subject=_subject(), raw_p_value=p, accounting=TrialAccounting(raw_trials=n, avg_correlation=rho)
    )


def test_single_trial_deflation_is_identity() -> None:
    """A lone honest test (N=1) is neither penalised nor flattered: deflated p == raw p (SI-3)."""
    decision = _gate().check(_submit(0.04, n=1, rho=0.0))
    assert decision.deflated.value == pytest.approx(0.04)
    assert decision.verdict is Verdict.PASS


def test_many_independent_trials_deflate_a_pass_into_a_fail() -> None:
    """SI-1/AP-2: a result that passes uncorrected FAILS once the trial family is accounted for."""
    # Raw p = 0.04 would pass at alpha=0.05 uncorrected...
    assert _gate().check(_submit(0.04, n=1, rho=0.0)).verdict is Verdict.PASS
    # ...but across 50 independent trials the family-wise p is ~0.87 -> FAIL.
    decision = _gate().check(_submit(0.04, n=50, rho=0.0))
    assert decision.verdict is Verdict.FAIL
    assert decision.deflated.value > 0.5


def test_correlation_reduces_the_penalty_si2() -> None:
    """SI-2: perfectly correlated trials collapse to one effective trial; a raw count cannot (AP-2)."""
    submission = _submit(0.04, n=50, rho=1.0)
    assert submission.accounting.effective_trials == pytest.approx(1.0)
    decision = _gate().check(submission)
    # With N_eff == 1 the deflation is the identity, so the honest result passes again.
    assert decision.deflated.value == pytest.approx(0.04)
    assert decision.verdict is Verdict.PASS


def test_effective_trials_between_raw_and_one() -> None:
    """SI-2: N_eff interpolates in [1, N] with correlation."""
    acc = TrialAccounting(raw_trials=100, avg_correlation=0.5)
    # 1 + 99 * 0.5 = 50.5
    assert acc.effective_trials == pytest.approx(50.5)
    assert 1.0 <= acc.effective_trials <= acc.raw_trials


def test_decision_reports_only_deflated_significance() -> None:
    """SI-3/FB-8: the published statistic is the deflated family-wise p-value, named as such."""
    decision = _gate().check(_submit(0.01, n=20, rho=0.0))
    assert decision.deflated.name == DEFLATED_P_VALUE
    expected = 1.0 - math.pow(1.0 - 0.01, 20)
    assert decision.deflated.value == pytest.approx(expected)


def test_reading_raw_significance_is_prohibited() -> None:
    """SI-3: there is no code path from a decision to an undeflated significance."""
    decision = _gate().check(_submit(0.01, n=20, rho=0.0))
    with pytest.raises(UndeflatedSignificance):
        _ = decision.raw_significance


def test_zero_trials_fails_closed() -> None:
    """FB-5: significance without an enrolled trial is impossible — the family must be counted."""
    with pytest.raises(BudgetViolation):
        TrialAccounting(raw_trials=0, avg_correlation=0.0)


def test_invalid_policy_and_inputs_are_rejected() -> None:
    for bad_alpha in (0.0, 1.0, -0.1, 1.5):
        with pytest.raises(BudgetViolation):
            BudgetPolicy(alpha=bad_alpha)
    for bad_rho in (-0.01, 1.01):
        with pytest.raises(BudgetViolation):
            TrialAccounting(raw_trials=5, avg_correlation=bad_rho)
    for bad_p in (-0.001, 1.001):
        with pytest.raises(BudgetViolation):
            _submit(bad_p, n=5, rho=0.0)


def test_threshold_is_the_policy_alpha() -> None:
    decision = MultipleTestingBudgetGate(BudgetPolicy(alpha=0.01)).check(_submit(0.001, n=3, rho=0.0))
    assert decision.threshold == 0.01
    assert isinstance(decision, BudgetDecision)


def test_deterministic_same_submission_same_decision() -> None:
    """DE-2: identical submissions yield identical deflated values across independent gates."""
    a = _gate().check(_submit(0.02, n=37, rho=0.25))
    b = _gate().check(_submit(0.02, n=37, rho=0.25))
    assert a.deflated.value == b.deflated.value
    assert a.effective_trials == b.effective_trials
    assert a.verdict is b.verdict
