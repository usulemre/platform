"""Golden-set tests for the Research-to-Production Parity Harness (VS-1, CS-2, P3-15)."""
from __future__ import annotations

import pytest
from execution_service.parity import (
    UNVERIFIABLE,
    ParityObservation,
    ParitySpec,
    ParitySpecError,
    ResearchProductionParityHarness,
)


def _harness(tol: float = 0.05) -> ResearchProductionParityHarness:
    return ResearchProductionParityHarness(ParitySpec(tolerance=tol))


def test_identical_values_are_parity_clean() -> None:
    obs = (ParityObservation("sig_a", 1.0, 1.0), ParityObservation("sig_b", -2.0, -2.0))
    result = _harness().check(obs)
    assert result.within_tolerance is True
    assert result.max_divergence == 0.0


def test_small_divergence_within_tolerance() -> None:
    obs = (ParityObservation("sig_a", 100.0, 103.0),)  # 3% divergence, tol 5%
    assert _harness(0.05).check(obs).within_tolerance is True


def test_worst_case_not_averaged_away() -> None:
    """P3-15: one badly-diverging signal breaks parity even if others are perfect."""
    obs = (
        ParityObservation("good", 100.0, 100.0),
        ParityObservation("bad", 100.0, 130.0),  # 30% divergence
    )
    result = _harness(0.05).check(obs)
    assert result.within_tolerance is False
    assert result.worst == "bad"
    # symmetric relative divergence: |100-130| / max(100,130) = 30/130
    assert result.max_divergence == pytest.approx(30.0 / 130.0)


def test_both_zero_is_perfect_parity() -> None:
    assert _harness().check((ParityObservation("z", 0.0, 0.0),)).within_tolerance is True


def test_empty_observations_fail_closed() -> None:
    """P3-15: nothing to compare cannot be certified parity-clean."""
    result = _harness().check(())
    assert result.within_tolerance is False
    assert result.max_divergence == UNVERIFIABLE
    assert result.worst is None


def test_divergence_is_symmetric() -> None:
    a = _harness().check((ParityObservation("x", 100.0, 130.0),)).max_divergence
    b = _harness().check((ParityObservation("x", 130.0, 100.0),)).max_divergence
    assert a == b


def test_invalid_tolerance_rejected() -> None:
    for bad in (0.0, -0.1):
        with pytest.raises(ParitySpecError):
            ParitySpec(tolerance=bad)


def test_deterministic() -> None:
    obs = (ParityObservation("x", 10.0, 10.4),)
    assert _harness().check(obs) == _harness().check(obs)
