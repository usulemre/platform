"""Multiple-Testing Budget Gate — the deterministic significance adjudicator (P2-02, SI-1..SI-3).

The fifth deterministic engine in the platform. It is the *only* place statistical significance is
decided (VS-1), it runs with every AI actor suspended (AI-2, SI-5), and it exists to defeat the two
adversaries the Constitution names: naive uncorrected significance (SI-1) and the global counter
masquerading as control (AP-2).

Enforced by construction:

* **Deflated, never raw (SI-3, FB-8).** The gate never compares a raw p-value to the budget. It
  computes a family-wise ("deflated") p-value from the *number of trials* and adjudicates on that.
  There is no code path that yields a verdict from an undeflated statistic; an attempt to read one
  raises ``UndeflatedSignificance``.
* **Effective trials, not a raw count (SI-2, AP-2).** The denominator accounts for trial
  correlation: ``N_eff = 1 + (N - 1)(1 - rho)``. Perfectly correlated trials (``rho = 1``) collapse
  to a single effective trial; independent trials (``rho = 0``) each cost the full budget. A bare
  incrementing counter cannot express this, which is exactly why AP-2 is forbidden.
* **Enforced over the immutable Trial Ledger (SI-1, P2-01).** ``raw_trials`` is the honest
  denominator supplied from the append-only ledger's ``total`` (EX-4). A submission that claims a
  discovery with zero enrolled trials fails closed (FB-5) — you cannot have tested without being
  counted.
* **Deterministic (DE-1, DE-2, VS-1).** Same submission ⇒ same decision and same deflated value. No
  wall-clock, randomness, or I/O is read (CS-3, PIT-4); the arithmetic is pure ``math``.

Separation of powers (CP-5): the gate *reads* the ledger's trial count (supplied in the submission),
it never reaches into the capture context to mutate it, and it never observes generation. It mirrors
the Scientific Gate's stance — value object in, immutable decision out.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from core_domain.shared import DomainError, Ref
from core_domain.validation import DeflatedMetric, UndeflatedSignificance, Verdict

#: The name under which the gate publishes its only significance statistic (SI-3). There is no
#: "raw p-value" output — the deflated value is the sole adjudicable significance the gate emits.
DEFLATED_P_VALUE = "familywise_deflated_p_value"


class BudgetViolation(DomainError):
    """A budget submission is internally inconsistent (invalid policy, probability, or accounting)."""


@dataclass(frozen=True, slots=True)
class BudgetPolicy:
    """The family-wise error budget a family of trials is adjudicated against (P2-02).

    ``alpha`` is the maximum tolerated family-wise false-discovery probability (e.g. ``0.05``): the
    deflated p-value must not exceed it. The budget is a versioned, deterministic policy, never a
    per-candidate judgement call (DE-2).
    """

    alpha: float

    def __post_init__(self) -> None:
        if not (0.0 < self.alpha < 1.0):
            raise BudgetViolation(f"alpha must be in (0, 1); got {self.alpha!r}")


@dataclass(frozen=True, slots=True)
class TrialAccounting:
    """The trial denominator, taken from the immutable Trial Ledger (SI-1, EX-4).

    ``raw_trials`` is the total number of trials enrolled in the candidate's family (``ledger.total``
    for that family). ``avg_correlation`` is the mean pairwise correlation among their test
    statistics in ``[0, 1]`` — the input that turns a raw count into an *effective* count (SI-2).
    """

    raw_trials: int
    avg_correlation: float

    def __post_init__(self) -> None:
        if self.raw_trials < 1:
            # FB-5: no significance without an enrolled trial — the family must be counted.
            raise BudgetViolation(
                f"raw_trials must be >= 1 (a tested candidate is always ledger-counted); "
                f"got {self.raw_trials!r}"
            )
        if not (0.0 <= self.avg_correlation <= 1.0):
            raise BudgetViolation(
                f"avg_correlation must be in [0, 1]; got {self.avg_correlation!r}"
            )

    @property
    def effective_trials(self) -> float:
        """The effective number of independent trials (SI-2), in ``[1, raw_trials]``.

        ``rho = 0`` ⇒ every trial is independent and costs the full budget (``N_eff = N``);
        ``rho = 1`` ⇒ all trials are the same test and cost one (``N_eff = 1``). A raw counter
        (AP-2) is the degenerate ``rho = 0`` case with no way to express correlation.
        """
        return 1.0 + (self.raw_trials - 1) * (1.0 - self.avg_correlation)


@dataclass(frozen=True, slots=True)
class BudgetSubmission:
    """One adjudication request at the budget gate."""

    subject: Ref  # -> the factor/strategy/feature candidate under test
    raw_p_value: float  # the candidate's single-test p-value, BEFORE deflation
    accounting: TrialAccounting

    def __post_init__(self) -> None:
        if not (0.0 <= self.raw_p_value <= 1.0):
            raise BudgetViolation(
                f"raw_p_value must be a probability in [0, 1]; got {self.raw_p_value!r}"
            )


@dataclass(frozen=True, slots=True)
class BudgetDecision:
    """The immutable outcome of the gate. Its significance field is *always* deflated (SI-3)."""

    subject: Ref
    verdict: Verdict
    deflated: DeflatedMetric  # the family-wise p-value; the only significance the gate publishes
    threshold: float  # the budget alpha the deflated value was compared against
    effective_trials: float

    @property
    def raw_significance(self) -> float:
        """Reading raw (undeflated) significance off a decision is prohibited (SI-3, FB-8)."""
        raise UndeflatedSignificance(
            "a budget decision exposes only the deflated family-wise p-value (SI-3); "
            "presenting undeflated significance as evidence is prohibited"
        )


class MultipleTestingBudgetGate:
    """The deterministic Multiple-Testing Budget gate (P2-02).

    Fulfils the intent of ``core_domain.validation.MultipleTestingEnforcer``: it enforces the budget
    over the Trial Ledger. It takes the ledger's trial count in the submission rather than reaching
    into the capture context, preserving separation of powers (CP-5), exactly as the Scientific Gate
    consumes clearances it does not itself produce.
    """

    __slots__ = ("_policy",)

    def __init__(self, policy: BudgetPolicy) -> None:
        self._policy = policy

    def check(self, submission: BudgetSubmission) -> BudgetDecision:
        n_eff = submission.accounting.effective_trials
        deflated_p = self._deflate(submission.raw_p_value, n_eff)
        verdict = Verdict.PASS if deflated_p <= self._policy.alpha else Verdict.FAIL
        return BudgetDecision(
            subject=submission.subject,
            verdict=verdict,
            deflated=DeflatedMetric(name=DEFLATED_P_VALUE, value=deflated_p),
            threshold=self._policy.alpha,
            effective_trials=n_eff,
        )

    @staticmethod
    def _deflate(raw_p: float, effective_trials: float) -> float:
        """Šidák family-wise deflation: ``p_fw = 1 - (1 - p)^(N_eff)`` (SI-3).

        The probability that at least one of ``N_eff`` independent trials is at least this extreme
        under the null. Monotone increasing in ``N_eff`` — more trials make a fixed result harder to
        call significant, which is the whole point of multiple-testing control. With a single
        effective trial the deflation is the identity, so a lone honest test is neither penalised nor
        flattered.
        """
        return 1.0 - math.pow(1.0 - raw_p, effective_trials)


__all__ = [
    "DEFLATED_P_VALUE",
    "BudgetDecision",
    "BudgetPolicy",
    "BudgetSubmission",
    "BudgetViolation",
    "MultipleTestingBudgetGate",
    "TrialAccounting",
]
