"""Portfolio Construction Engine — the deterministic, net-of-cost optimizer (PS-1..4).

The tenth deterministic engine in the platform. It turns a set of *capital-eligible* alphas into an
immutable, content-addressed portfolio snapshot: target weights produced by a deterministic
optimizer that respects hard constraints and never sees a gross (pre-cost) number. It sits directly
upstream of the Risk Limit Engine in the trading chain (Portfolio → Risk → Execution).

Enforced by construction:

* **Eligible alphas only, never re-adjudicated (PS-1).** Every candidate must carry a
  ``CapitalEligibilityToken`` issued by the Scientific Governance Gate (engine #4) *for that same
  subject*; a missing or mismatched token raises ``IneligibleAlpha``. The engine consumes the token
  as proof — it does not re-check whether the signal is real (that would be ``SignalReadjudication``).
* **Net-of-cost, never gross (PS-2, AD-1).** Every candidate score must be flagged net-of-cost; a
  gross input raises ``GrossOptimization``. Selecting on pre-cost performance is prohibited.
* **Constraint-respecting (PS-2).** Weights are produced by deterministic water-filling: proportional
  to net-of-cost alpha, capped at ``max_weight`` with the excess redistributed, normalized to full
  investment. An infeasible cap (``max_weight × N < 1``) or an all-non-positive universe fails closed
  with ``ConstraintViolation`` rather than silently emitting an out-of-constraint portfolio.
* **No AI sizing (PS-3, AI-1).** An AI constructor is rejected with ``AIAllocationDecision``.
* **Immutable, content-addressed snapshot (PS-4, CP-2, NM-2).** The portfolio id and snapshot are the
  SHA-256 of its canonical (order-independent) allocations, so identical inputs yield the identical
  snapshot and a name denotes exactly one portfolio version. Deterministic (DE-2): no wall-clock,
  randomness or I/O (CS-3).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

from core_domain.governance import CapitalEligibilityToken
from core_domain.portfolio import Allocation, Portfolio, PortfolioRationale, Weight
from core_domain.shared import ActorKind, ActorRef, ContentAddress, EntityId, Provenance, Ref

from portfolio_service.errors import (
    AIAllocationDecision,
    ConstraintViolation,
    GrossOptimization,
    IneligibleAlpha,
)

_EPS = 1e-9


@dataclass(frozen=True, slots=True)
class EligibleCandidate:
    """One capital-eligible alpha offered to the optimizer.

    ``token`` must certify *this* ``strategy`` (PS-1). ``net_of_cost_score`` is the expected
    net-of-cost alpha used for sizing; ``net_of_cost`` asserts it is post-cost (PS-2).
    """

    strategy: Ref  # -> strategy.Strategy / signal.Signal
    token: CapitalEligibilityToken | None
    net_of_cost_score: float
    net_of_cost: bool


@dataclass(frozen=True, slots=True)
class ConstructionConstraints:
    """Hard optimization constraints (PS-2). ``max_weight`` is the per-position ceiling."""

    max_weight: float
    long_only: bool = True

    def __post_init__(self) -> None:
        if not (0.0 < self.max_weight <= 1.0):
            raise ConstraintViolation(f"max_weight must be in (0, 1]; got {self.max_weight!r}")


@dataclass(frozen=True, slots=True)
class ConstructionRequest:
    """One portfolio-construction request."""

    candidates: tuple[EligibleCandidate, ...]
    constraints: ConstructionConstraints
    constructor: ActorRef  # the deterministic engine actor; never AI (PS-3)
    rationale: str
    provenance: Provenance


class PortfolioConstructionEngine:
    """The deterministic, net-of-cost portfolio optimizer (PS-1..4)."""

    def construct(self, request: ConstructionRequest) -> Portfolio:
        # PS-3/AI-1: an AI actor may never decide allocation or sizing.
        if request.constructor.kind is ActorKind.AI_AGENT:
            raise AIAllocationDecision("an AI actor may not decide allocation or sizing (PS-3)")
        eligible = self._require_eligible(request.candidates)
        self._require_net_of_cost(eligible)
        weighted = self._optimize(eligible, request.constraints)
        allocations = tuple(
            Allocation(strategy=c.strategy, weight=Weight(value=w)) for c, w in weighted
        )
        return self._assemble(allocations, request)

    # ---- checks -----------------------------------------------------------------------------

    @staticmethod
    def _require_eligible(
        candidates: tuple[EligibleCandidate, ...],
    ) -> list[EligibleCandidate]:
        if not candidates:
            raise ConstraintViolation("no candidates offered for construction")
        for c in candidates:
            # PS-1: a valid capital-eligibility token, issued for THIS subject, is required.
            if c.token is None:
                raise IneligibleAlpha(
                    f"candidate {c.strategy.id!r} lacks a capital-eligibility token (PS-1)"
                )
            if c.token.subject.id != c.strategy.id:
                raise IneligibleAlpha(
                    f"token {c.token.id!r} certifies {c.token.subject.id!r}, not "
                    f"{c.strategy.id!r} (PS-1); tokens are non-transferable"
                )
        return list(candidates)

    @staticmethod
    def _require_net_of_cost(candidates: list[EligibleCandidate]) -> None:
        for c in candidates:
            if not c.net_of_cost:
                # PS-2/AD-1: selecting on gross (pre-cost) performance is prohibited.
                raise GrossOptimization(
                    f"candidate {c.strategy.id!r} score is not net-of-cost (PS-2)"
                )

    # ---- optimization (deterministic water-filling) -----------------------------------------

    @staticmethod
    def _optimize(
        candidates: list[EligibleCandidate], constraints: ConstructionConstraints
    ) -> list[tuple[EligibleCandidate, float]]:
        max_w = constraints.max_weight
        active = [
            c
            for c in candidates
            if not constraints.long_only or c.net_of_cost_score > 0.0
        ]
        if not active:
            raise ConstraintViolation(
                "no eligible candidate with positive net-of-cost alpha to allocate (PS-2)"
            )
        n = len(active)
        if max_w * n < 1.0 - _EPS:
            raise ConstraintViolation(
                f"max_weight={max_w} is infeasible for {n} positions: cannot reach full investment"
            )

        scores = [c.net_of_cost_score for c in active]
        capped: set[int] = set()
        weights = [0.0] * n
        while True:
            remaining = 1.0 - max_w * len(capped)
            active_idx = [i for i in range(n) if i not in capped]
            score_sum = sum(scores[i] for i in active_idx)
            newly = [
                i for i in active_idx if remaining * scores[i] / score_sum > max_w + _EPS
            ]
            if not newly:
                for i in active_idx:
                    weights[i] = remaining * scores[i] / score_sum
                for i in capped:
                    weights[i] = max_w
                break
            capped.update(newly)
        return [(active[i], weights[i]) for i in range(n)]

    # ---- assembly (content-addressed, immutable) --------------------------------------------

    @staticmethod
    def _assemble(
        allocations: tuple[Allocation, ...], request: ConstructionRequest
    ) -> Portfolio:
        # Canonical, order-independent form so the snapshot is a pure function of the allocation.
        canonical = "|".join(
            sorted(f"{a.strategy.id}:{a.weight.value:.12f}" for a in allocations)
        )
        digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return Portfolio(
            id=EntityId(f"PF-{digest[:16]}"),
            snapshot=ContentAddress(algorithm="sha256", digest=digest),
            allocations=allocations,
            rationale=PortfolioRationale(text=request.rationale),
            provenance=request.provenance,
        )


__all__ = [
    "ConstructionConstraints",
    "ConstructionRequest",
    "EligibleCandidate",
    "PortfolioConstructionEngine",
]
