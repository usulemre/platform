"""Research-to-Production Parity Harness — the deterministic parity gate (P3-15).

The eighth deterministic engine in the platform. Before an execution may go LIVE, what production
would actually do must match what research validated (P3-15): a strategy that behaves differently in
production than in the backtest has silently invalidated its own evidence. This harness compares
paired research/production observations and decides whether their divergence is within a versioned
tolerance. Its clean report is the ``parity_clean`` clearance the Execution Authorization Engine
reads before LIVE; a breach raises ``ParityBreach``.

Enforced by construction:

* **Symmetric, bounded divergence.** Per pair, ``|research - production| / max(|research|,
  |production|)`` — a relative measure that is 0 for identical values and needs no privileged
  "denominator" side. Two exact zeros are perfect parity.
* **Worst-case, not average.** Parity holds only if *every* observation is within tolerance; the
  aggregate is the maximum divergence, so one badly-diverging signal cannot be averaged away.
* **Fail closed (P3-15).** An execution with no paired observations cannot be shown parity-clean, so
  it reports a breach — absence of evidence is not evidence of parity.
* **Deterministic (DE-2).** Same observations + tolerance ⇒ same report and same worst offender. No
  wall-clock, randomness or I/O (CS-3).
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.execution import ParityReport

from execution_service.errors import ParityBreach

#: Reported when there is nothing to compare: parity cannot be established, so it fails closed.
UNVERIFIABLE = float("inf")


class ParitySpecError(ParityBreach):
    """The parity specification is invalid (non-positive tolerance)."""


@dataclass(frozen=True, slots=True)
class ParitySpec:
    """A versioned parity tolerance (relative). ``tolerance`` is the maximum divergence allowed."""

    tolerance: float

    def __post_init__(self) -> None:
        if not (self.tolerance > 0.0):
            raise ParitySpecError(f"tolerance must be > 0; got {self.tolerance!r}")


@dataclass(frozen=True, slots=True)
class ParityObservation:
    """One paired observation: what research expected vs what production realized (P3-15)."""

    name: str
    research_value: float
    production_value: float


@dataclass(frozen=True, slots=True)
class ParityResult:
    """The immutable, explainable parity outcome (EXP-2)."""

    report: ParityReport
    max_divergence: float
    worst: str | None  # the name of the worst-diverging observation, if any

    @property
    def within_tolerance(self) -> bool:
        return self.report.within_tolerance


class ResearchProductionParityHarness:
    """The deterministic parity harness (P3-15). Fulfils the intent of
    ``core_domain.execution.ParityHarness`` over an explicit observation set."""

    __slots__ = ("_spec",)

    def __init__(self, spec: ParitySpec) -> None:
        self._spec = spec

    def check(self, observations: tuple[ParityObservation, ...]) -> ParityResult:
        if not observations:
            # Fail closed: nothing to compare cannot be certified parity-clean.
            return ParityResult(
                report=ParityReport(within_tolerance=False), max_divergence=UNVERIFIABLE, worst=None
            )
        worst_obs = max(observations, key=self._divergence)
        max_divergence = self._divergence(worst_obs)
        within = max_divergence <= self._spec.tolerance
        return ParityResult(
            report=ParityReport(within_tolerance=within),
            max_divergence=max_divergence,
            worst=worst_obs.name,
        )

    @staticmethod
    def _divergence(obs: ParityObservation) -> float:
        denom = max(abs(obs.research_value), abs(obs.production_value))
        if denom == 0.0:  # both exactly zero -> perfect parity
            return 0.0
        return abs(obs.research_value - obs.production_value) / denom


__all__ = [
    "UNVERIFIABLE",
    "ParityObservation",
    "ParityResult",
    "ParitySpec",
    "ParitySpecError",
    "ResearchProductionParityHarness",
]
