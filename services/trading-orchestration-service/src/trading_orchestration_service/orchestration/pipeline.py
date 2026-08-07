"""The Trading Pipeline — deterministic composition of the trading chain (WCON-1/2, CP-5).

This is the seam that turns eleven isolated deterministic engines into one running trading chain. It
sequences portfolio -> risk -> parity -> execution and threads each engine's *immutable output* into
the next engine's input — the wiring that did not exist before:

    RiskDecision.signed_off        -> AuthorizationEvidence.risk_signed_off
    ParityResult.within_tolerance  -> AuthorizationEvidence.parity_clean
    Portfolio (constructed)        -> the subject risk evaluates and execution authorizes

It ORCHESTRATES, it never ADJUDICATES (WCON-2, DH-7): every decision stays inside its own engine; the
pipeline only sequences them, stops at the first failing gate (fail closed, RS-3 / §20), and records
the outcome. It reads no wall-clock (the instant is supplied) so a run is reproducible (DE-2), and it
always emits a ``TradingDecisionRecord`` — even on rejection — so every trade and every refusal is
auditable and explainable (CP-7, OB-1, EXP-2).
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.execution import AuthorizationToken, ExecutionMode
from core_domain.risk import Exposure, RiskLimit
from core_domain.shared import ActorRef, KnowledgeTime, Provenance, Ref
from execution_service.authorization.engine import (
    AuthorizationEvidence,
    AuthorizationRequest,
    ExecutionAuthorizationEngine,
)
from execution_service.errors import ExecutionError
from execution_service.parity import (
    ParityObservation,
    ParitySpec,
    ResearchProductionParityHarness,
)
from portfolio_service.errors import PortfolioError
from portfolio_service.optimization.engine import (
    ConstructionConstraints,
    ConstructionRequest,
    EligibleCandidate,
    PortfolioConstructionEngine,
)
from risk_service.errors import RiskError
from risk_service.limits.engine import RiskEvaluation, RiskLimitEngine
from trading_orchestration_service.orchestration.record import (
    StageOutcome,
    TradingDecisionRecord,
    TradingOutcome,
    TradingStage,
    build_record,
)

_MODE_OUTCOME = {
    ExecutionMode.LIVE: TradingOutcome.APPROVED_LIVE,
    ExecutionMode.PAPER: TradingOutcome.APPROVED_PAPER,
    ExecutionMode.HALT: TradingOutcome.HALTED,
}


@dataclass(frozen=True, slots=True)
class TradingPipelineRequest:
    """All inputs the chain consumes. The pipeline supplies engine *outputs* between stages; the
    caller supplies the *external* inputs (candidates, measured exposures, observations, actors,
    clock, token). Nothing here is a clearance the pipeline itself is trusted to assert."""

    # -- portfolio construction (PS-1..4) --
    candidates: tuple[EligibleCandidate, ...]
    constraints: ConstructionConstraints
    constructor: ActorRef
    portfolio_rationale: str
    provenance: Provenance
    # -- risk (RS-1..3) — exposures are MEASURED upstream and supplied; risk only adjudicates --
    risk_limits: tuple[RiskLimit, ...]
    exposures: tuple[Exposure, ...]
    risk_producer: ActorRef  # who produced the subject (independence, RS-2)
    risk_assessor: ActorRef  # the independent risk authority
    # -- parity (P3-15) --
    parity_spec: ParitySpec
    parity_observations: tuple[ParityObservation, ...]
    # -- execution authorization (RS-4, DEP-1) --
    requested_mode: ExecutionMode
    authorizer: ActorRef
    now: KnowledgeTime
    validated: bool  # execution passed lifecycle validation (supplied clearance)
    token: AuthorizationToken | None = None
    counter_signed: bool = False
    kill_switch_engaged: bool = False


class TradingPipeline:
    """The deterministic trading-chain orchestrator. Engines are injected (composition root); each
    defaults to a fresh instance for convenience. The pipeline holds no state and no decision."""

    __slots__ = ("_portfolio", "_risk", "_execution")

    def __init__(
        self,
        *,
        portfolio: PortfolioConstructionEngine | None = None,
        risk: RiskLimitEngine | None = None,
        execution: ExecutionAuthorizationEngine | None = None,
    ) -> None:
        self._portfolio = portfolio or PortfolioConstructionEngine()
        self._risk = risk or RiskLimitEngine()
        self._execution = execution or ExecutionAuthorizationEngine()

    def run(self, request: TradingPipelineRequest) -> TradingDecisionRecord:
        stages: list[StageOutcome] = []

        # 0. Kill-switch dominates everything and short-circuits to HALT (RS-3, §20 fail-first).
        if request.kill_switch_engaged:
            stages.append(
                StageOutcome(
                    TradingStage.KILL_SWITCH,
                    passed=False,
                    detail="kill-switch engaged; the chain is halted before any engine runs (RS-3)",
                    reasons=("kill_switch_engaged",),
                )
            )
            return build_record(TradingOutcome.HALTED, ExecutionMode.HALT, None, tuple(stages))

        # 1. Portfolio construction (PS-1..4). A domain rejection fails closed.
        try:
            portfolio = self._portfolio.construct(
                ConstructionRequest(
                    candidates=request.candidates,
                    constraints=request.constraints,
                    constructor=request.constructor,
                    rationale=request.portfolio_rationale,
                    provenance=request.provenance,
                )
            )
        except PortfolioError as exc:
            stages.append(self._failed(TradingStage.PORTFOLIO, exc))
            return build_record(TradingOutcome.REJECTED_INELIGIBLE, None, None, tuple(stages))

        portfolio_ref = Ref(id=portfolio.id.value, target="portfolio.Portfolio")
        stages.append(
            StageOutcome(
                TradingStage.PORTFOLIO,
                passed=True,
                detail=f"constructed portfolio {portfolio.id.value} with "
                f"{len(portfolio.allocations)} allocation(s)",
            )
        )

        # 2. Risk (RS-1..3). Thread the constructed portfolio in as the subject.
        try:
            risk = self._risk.evaluate(
                RiskEvaluation(
                    subject=portfolio_ref,
                    producer=request.risk_producer,
                    assessor=request.risk_assessor,
                    limits=request.risk_limits,
                    exposures=request.exposures,
                )
            )
        except RiskError as exc:
            stages.append(self._failed(TradingStage.RISK, exc))
            return build_record(TradingOutcome.REJECTED_RISK, None, portfolio_ref, tuple(stages))

        if not risk.signed_off:
            reasons = tuple(b.limit.name for b in risk.breaches)
            stages.append(
                StageOutcome(
                    TradingStage.RISK,
                    passed=False,
                    detail=f"risk breach on: {', '.join(reasons)}",
                    reasons=reasons,
                )
            )
            return build_record(TradingOutcome.REJECTED_RISK, None, portfolio_ref, tuple(stages))
        stages.append(StageOutcome(TradingStage.RISK, passed=True, detail="within all risk limits"))

        # 3. Parity (P3-15).
        parity = ResearchProductionParityHarness(request.parity_spec).check(
            request.parity_observations
        )
        if not parity.within_tolerance:
            reasons = (parity.worst,) if parity.worst is not None else ("no_observations",)
            stages.append(
                StageOutcome(
                    TradingStage.PARITY,
                    passed=False,
                    detail=f"parity breach (worst={parity.worst}, "
                    f"max_divergence={parity.max_divergence})",
                    reasons=reasons,
                )
            )
            return build_record(TradingOutcome.REJECTED_PARITY, None, portfolio_ref, tuple(stages))
        stages.append(
            StageOutcome(TradingStage.PARITY, passed=True, detail="research-production parity clean")
        )

        # 4. Execution authorization (RS-4, DEP-1). Thread risk + parity clearances into the evidence.
        evidence = AuthorizationEvidence(
            validated=request.validated,
            risk_signed_off=risk.signed_off,
            parity_clean=parity.within_tolerance,
        )
        try:
            decision = self._execution.authorize(
                AuthorizationRequest(
                    execution=portfolio_ref,
                    requested_mode=request.requested_mode,
                    authorizer=request.authorizer,
                    now=request.now,
                    evidence=evidence,
                    token=request.token,
                    counter_signed=request.counter_signed,
                    kill_switch_engaged=False,  # already handled at step 0
                )
            )
        except ExecutionError as exc:
            stages.append(self._failed(TradingStage.EXECUTION, exc))
            return build_record(TradingOutcome.UNAUTHORIZED, None, portfolio_ref, tuple(stages))

        mode = decision.authorization.mode
        stages.append(
            StageOutcome(
                TradingStage.EXECUTION,
                passed=mode is not ExecutionMode.HALT,
                detail=decision.rationale,
            )
        )
        return build_record(_MODE_OUTCOME[mode], mode, portfolio_ref, tuple(stages))

    @staticmethod
    def _failed(stage: TradingStage, exc: Exception) -> StageOutcome:
        return StageOutcome(
            stage, passed=False, detail=str(exc), reasons=(type(exc).__name__,)
        )


__all__ = ["TradingPipeline", "TradingPipelineRequest"]
