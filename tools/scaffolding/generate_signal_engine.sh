#!/usr/bin/env bash
#
# generate_signal_engine.sh — Phase 2.7 Signal Engine generator.
#
# Governed by: CLAUDE.md (AD-1/3, RS-1, CP-2/5/7, AI-1/2, DE-1, PS-1, RL-1/2); Architecture V2 §5.5
#              (Research Intelligence Layer), §6.1 (isolation barrier), §6.3; Implementation Roadmap
#              Phase 3; RB-09/10 · FAR, RB-13 · RISK; Signal Registry; P2-07.
#
# Emits the Signal Engine under services/signal-service as `signal_service`: the signal aggregate +
# lifecycle, generation, classification, validation coordination, ranking, scoring, approval, registry
# integration, metadata, governance, decision model, dependencies, service/repository interfaces,
# policies, specifications, domain events, and errors. It reuses core_domain (signal context + shared
# kernel) and the Validation Foundation; it references Feature/Experiment/Backtesting/Risk by identity.
#
# The Signal Engine is the DETERMINISTIC decision layer that standardizes validated research outputs
# into signals. It consumes validated Features, Experiment evidence, Backtesting results, and APPROVED
# Risk assessments. It is net-of-cost (AD-1), never observes per-candidate validation/OOS outcomes
# (isolation barrier, AD-3, P2-07), and NEVER activates a signal without a mandatory Risk approval
# (RS-1). It is NOT portfolio construction, NOT execution, NOT machine learning. It contains NO signal
# generation algorithms, NO ranking algorithms, NO scoring formulas, NO persistence, NO infrastructure,
# NO API. Deterministic, technology-independent, immutable, auditable, traceable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/signal-service"
SRC="$SVC/src/signal_service"
cd "$ROOT"

sgreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# signal-service · $2

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose
$3

## Responsibilities
$4

## Relationships
$5

## Dependencies
$6

## Related Governance Documents
$7
EOF
}

# ===========================================================================
# SERVICE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$SVC/pyproject.toml" <<'TOML'
# signal-service — the deterministic Signal Engine (Phase 2.7).
# Standard library + Phase-1/2 foundations only. No signal-algo/ranking/scoring/persistence/broker deps.
[project]
name = "signal-service"
version = "0.1.0"
description = "Signal Engine: deterministic signal model, decision, scoring/ranking interfaces, governance."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/signal_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# signal-service — Signal Engine implemented in Phase 2.7

This service contains the Signal Engine (the `signal_service` package): the signal aggregate,
lifecycle, generation, classification, validation coordination, ranking, scoring, approval, registry
integration, metadata, governance, decision model, dependencies, service/repository interfaces,
policies, specifications, domain events, and errors. Signal-generation algorithms, ranking algorithms,
scoring formulas, ML, portfolio construction, execution authority, broker integration, persistence,
infrastructure, and APIs remain forbidden here. The deterministic scoring/ranking engines plug in
behind the interfaces; portfolio construction and execution belong to their own layers.
MD

cat > "$SVC/README.md" <<'MD'
# Signal Service — the Signal Engine (`signal_service`)

> **Phase 2.7 — Signal Engine (implemented).** The deterministic decision layer that transforms
> validated research outputs into standardized investment signals. The institutional source of truth
> for all investment signals. **Decision model & interfaces only** — no signal-generation algorithms,
> no ranking algorithms, no scoring formulas, no ML, no portfolio construction, no execution
> authority, no broker integration, no infrastructure, no API.

## Purpose
Realize the signal capability of the **Research Intelligence Layer** (Architecture V2 §5.5). The
Signal Engine consumes **validated Features**, **Experiment evidence**, **Backtesting results**, and
**approved Risk assessments**, and standardizes them into signals — **deterministically**,
**net-of-cost** (AD-1), and only after a **mandatory Risk approval** (RS-1). It reuses the Phase-1/2
foundations and integrates with the Signal Registry.

## Authority & boundaries
It **decides deterministically**; it is **not** portfolio construction, **not** execution, and **not**
machine learning. It contains **no** signal-generation algorithms, ranking algorithms, or scoring
formulas — those plug in behind the interfaces as versioned, golden-tested deterministic engines
(DE-1/2). It never observes per-candidate validation/OOS outcomes (the isolation barrier, AD-3,
`P2-07`), and it holds no execution authority.

## What is here (Phase 2.7)
20 modules, each a subpackage with its own `README.md`:
`model` · `status` · `lifecycle` · `classification` · `decision` · `scoring` · `ranking` ·
`dependencies` · `generation` · `validation_coordination` · `approval` · `registry_integration` ·
`metadata` · `governance` · `management` · `policies` · `specifications` · `events` · `errors` ·
`repositories`.

- **Canonical models:** `Signal` (aggregate, reuses `core_domain.AggregateRoot` + `SignalSpec`),
  `SignalIdentifier`, `SignalMetadata`, `SignalClassification`, `SignalStatus`, `SignalPriority`,
  `SignalScore`, `SignalConfidence`, `SignalEvidence`, `SignalDependency`, `SignalApproval`,
  `SignalDecision`.
- **Lifecycle:** `PROPOSED → GENERATED → VALIDATING → APPROVED → ACTIVE → SUPERSEDED → RETIRED`
  (+ `REJECTED`), supporting revision, replacement, expiration, and revalidation; skips forbidden
  (fail-closed).
- **Domain events:** `SignalGenerated`, `SignalValidated`, `SignalApproved`, `SignalRejected`,
  `SignalActivated`, `SignalSuperseded`, `SignalRetired`, `SignalScoreUpdated`, `SignalRegistryUpdated`.

## Integration (by identity / foundation)
- **Feature Service** — canonical feature source (`SignalEvidence.feature_ref`).
- **Experiment Service** — canonical experiment source (`SignalEvidence.experiment_ref`).
- **Backtesting Engine** — canonical performance-evidence source (`SignalEvidence.backtest_ref`).
- **Risk Engine** — **mandatory** approval source (`SignalEvidence.risk_approval_ref`; a signal never
  activates without it, RS-1).
- **Validation Foundation** — `validation_coordination` orchestrates validation.
- **Signal Registry** — `registry_integration` (register-before-use, immutable/versioned).

## Boundary rules (verified)
- **Deterministic, no ML/formulas:** `SignalScore`/`SignalConfidence` carry *values* (computed by the
  deterministic engine), never formulas; `DeterministicDecisionPolicy` + `MLSignalDecision` error.
- **Net-of-cost + mandatory Risk approval:** `NetOfCostPolicy`/`GrossSignalSelection` (AD-1);
  `MandatoryRiskApprovalPolicy`/`SignalMissingRiskApproval` (RS-1).
- **Isolation barrier:** `IsolationBarrierPolicy` + reused `GeneratorObservedValidation` (AD-3/P2-07).
- **No portfolio construction / execution:** `NoPortfolioConstructionPolicy`/`PortfolioConstructionAttempt`,
  `NoExecutionAuthorityPolicy`/`ExecutionAuthorityAttempt`.
- **Traceable, immutable:** `SignalEvidence` references all upstream sources by identity; all
  models/records/events are `frozen` dataclasses (runtime `FrozenInstanceError`); repositories append-only.
- **Compiles and imports cleanly**, 20 modules, no circular dependencies.

## Ownership
Accountable role: HQ (Head of Quantitative Research). Architecture owner: ARB.

## Dependencies
`core-domain`, `platform-validation`.

## Regeneration
Generated by [`tools/scaffolding/generate_signal_engine.sh`](../../tools/scaffolding/generate_signal_engine.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (AD-1/3, RS-1, CP-2/5/7, AI-1/2, DE-1, PS-1, RL-1/2); Architecture V2 §5.5, §6.1, §6.3;
Implementation Roadmap Phase 3; RB-09/10 · FAR; RB-13 · RISK; Signal Registry; `P2-07`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""signal_service — the deterministic Signal Engine.

Transforms validated research outputs into standardized investment signals. Consumes validated
Features, Experiment evidence, Backtesting results, and APPROVED Risk assessments; it is the
institutional source of truth for all investment signals.

Authority (AD-1/3, RS-1, CP-5, AI-1): it decides DETERMINISTICALLY; it is net-of-cost; it never
observes per-candidate validation/OOS outcomes (the isolation barrier, P2-07); and it NEVER activates
a signal without a mandatory Risk approval. It reuses core_domain (signal context + shared kernel) and
platform_validation, references upstream sources by identity, and integrates with the Signal Registry.

Boundaries: NOT portfolio construction, NOT execution, NOT machine learning. No signal-generation
algorithms, no ranking algorithms, no scoring formulas, no persistence, no infrastructure, no API. The
deterministic scoring/ranking engines plug in behind the interfaces.

Modules: model, status, lifecycle, classification, decision, scoring, ranking, dependencies,
generation, validation_coordination, approval, registry_integration, metadata, governance, management,
policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    approval,
    classification,
    decision,
    dependencies,
    errors,
    events,
    generation,
    governance,
    lifecycle,
    management,
    metadata,
    model,
    policies,
    ranking,
    registry_integration,
    repositories,
    scoring,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "classification", "decision", "scoring", "ranking",
    "dependencies", "generation", "validation_coordination", "approval", "registry_integration",
    "metadata", "governance", "management", "policies", "specifications", "events", "errors",
    "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class SignalLifecycle(Enum):
    """The canonical signal lifecycle (plus REJECTED)."""

    PROPOSED = "proposed"
    GENERATED = "generated"
    VALIDATING = "validating"
    APPROVED = "approved"
    ACTIVE = "active"
    SUPERSEDED = "superseded"
    RETIRED = "retired"
    REJECTED = "rejected"


L = SignalLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[SignalLifecycle, SignalLifecycle], ...] = (
    (L.PROPOSED, L.GENERATED),
    (L.GENERATED, L.VALIDATING),
    (L.VALIDATING, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.SUPERSEDED),
    (L.SUPERSEDED, L.RETIRED),
    # revision
    (L.GENERATED, L.PROPOSED),
    (L.VALIDATING, L.GENERATED),
    # replacement / expiration
    (L.ACTIVE, L.RETIRED),
    # revalidation
    (L.ACTIVE, L.VALIDATING),
    # rejection
    (L.VALIDATING, L.REJECTED),
    (L.APPROVED, L.REJECTED),
    (L.REJECTED, L.RETIRED),
)

#: Terminal state. Replacement creates a NEW versioned signal (with lineage), superseding the old (RL-1).
TERMINAL_STATES: frozenset[SignalLifecycle] = frozenset({L.RETIRED})


class SignalLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/ACTIVE require validation AND a mandatory Risk approval
    (RS-1); the service performs NO adjudication and no AI/ML decides (AI-1, DE-1). Interface only."""

    def transition(self, signal: EntityId, to: SignalLifecycle) -> None: ...
PY
sgreadme "$D" "lifecycle" \
"Define SignalLifecycle (PROPOSED/GENERATED/VALIDATING/APPROVED/ACTIVE/SUPERSEDED/RETIRED + REJECTED), the canonical transitions (revision/replacement/expiration/revalidation), and the lifecycle-service interface." \
"Enumerate the lifecycle and legal transitions as data; ACTIVE requires validation + mandatory Risk approval; replacement creates new lineage (RL-1); hold no logic." \
"Consumed by model, status, approval, governance, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-1, RL-1/2, AD-1, AI-1); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from signal_service.lifecycle import SignalLifecycle


@dataclass(frozen=True, slots=True)
class SignalStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: SignalLifecycle
    since: str
PY
sgreadme "$D" "status" \
"Define SignalStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent signal status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (SignalLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-09/10 · FAR."

# ===========================================================================
# classification
# ===========================================================================
D="$SRC/classification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Classification — the kind/horizon classification of a signal (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SignalKind(Enum):
    DIRECTIONAL = "directional"
    MEAN_REVERSION = "mean_reversion"
    MOMENTUM = "momentum"
    CARRY = "carry"
    VALUE = "value"
    QUALITY = "quality"
    COMPOSITE = "composite"


class SignalHorizon(Enum):
    INTRADAY = "intraday"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    MULTI_MONTH = "multi_month"


@dataclass(frozen=True, slots=True)
class SignalClassification:
    """The classification of a signal (kind + horizon; drives ontology placement, KM-3)."""

    kind: SignalKind
    horizon: SignalHorizon
PY
sgreadme "$D" "classification" \
"Define SignalClassification with SignalKind and SignalHorizon enums." \
"Classify signals within the shared ontology by kind and horizon; data only." \
"Consumed by model, metadata, specifications." \
"Standard library only." \
"CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry."

# ===========================================================================
# scoring
# ===========================================================================
D="$SRC/scoring"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Scoring — the score/confidence VALUE model and scoring INTERFACE (no formula here).

Scores/confidence are VALUES computed by the deterministic scoring engine and referenced here; this
module holds NO scoring formula and no ML.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class SignalScore:
    """A deterministic signal score VALUE (computed by the deterministic engine; no formula here)."""

    value: float
    method_ref: str  # reference to the deterministic scoring method (not the formula)


@dataclass(frozen=True, slots=True)
class SignalConfidence:
    """A deterministic confidence VALUE associated with a signal (no formula here)."""

    value: float


class SignalScoringService(Protocol):
    """Assigns a deterministic score to a signal (via the deterministic scoring engine). Interface only.

    It carries no scoring formula and runs no ML; the value is produced by the deterministic engine.
    """

    def score(self, signal: EntityId) -> SignalScore: ...
    def confidence(self, signal: EntityId) -> SignalConfidence: ...
PY
sgreadme "$D" "scoring" \
"Define SignalScore, SignalConfidence, and SignalScoringService: the score/confidence value model and scoring interface." \
"Represent scores/confidence as deterministic VALUES referenced from the deterministic engine; hold no scoring formula and no ML." \
"Consumed by ranking, decision, reporting; the deterministic scoring engine plugs in behind the interface." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (DE-1, AI-2, SI-3); Architecture V2 §5.5, §6.3; RB-09/10 · FAR."

# ===========================================================================
# ranking
# ===========================================================================
D="$SRC/ranking"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Ranking — the rank model and ranking INTERFACE (no ranking algorithm here)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class SignalRank:
    """An immutable rank of a signal (produced by the deterministic ranking engine; no algorithm here)."""

    signal_id: EntityId
    rank: int
    score_ref: str


class SignalRankingService(Protocol):
    """Ranks signals deterministically (via the deterministic ranking engine). Interface only.

    It carries no ranking algorithm; the ordering is produced by the deterministic engine.
    """

    def rank(self, signals: tuple[EntityId, ...]) -> tuple[SignalRank, ...]: ...
PY
sgreadme "$D" "ranking" \
"Define SignalRank and SignalRankingService: the rank model and ranking interface." \
"Represent ranks as immutable data produced by the deterministic ranking engine; hold no ranking algorithm." \
"Consumed by management; the deterministic ranking engine plugs in behind the interface." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (DE-1, AI-2); Architecture V2 §5.5, §6.3; RB-09/10 · FAR."

# ===========================================================================
# decision
# ===========================================================================
D="$SRC/decision"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Decision Model — the deterministic decision to standardize an output into a signal (data)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DecisionVerdict(Enum):
    GENERATE = "generate"
    REJECT = "reject"


@dataclass(frozen=True, slots=True)
class SignalDecision:
    """A deterministic decision with an explainable rationale (EXP-2).

    The decision is deterministic and never made by an LLM/ML (AI-1, DE-1).
    """

    verdict: DecisionVerdict
    rationale: str
PY
sgreadme "$D" "decision" \
"Define SignalDecision and DecisionVerdict: the deterministic, explainable decision to standardize a validated output into a signal." \
"Represent the signal decision as immutable, deterministic, explainable data; never AI/ML-decided; hold no logic." \
"Consumed by generation, management." \
"Standard library only." \
"CLAUDE.md (DE-1, AI-1, EXP-2); Architecture V2 §5.5, §6.3; RB-09/10 · FAR."

# ===========================================================================
# dependencies
# ===========================================================================
D="$SRC/dependencies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Dependencies — links to features/experiments/backtests/risk/upstream signals (by identity).

All links are by identity/reference (SE-2); none creates a channel that would let generation observe
per-candidate validation/OOS outcomes (the isolation barrier, AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class DependencyKind(Enum):
    FEATURE = "feature"
    EXPERIMENT = "experiment"
    BACKTEST = "backtest"
    RISK = "risk"                 # the mandatory approved Risk assessment
    UPSTREAM_SIGNAL = "upstream_signal"


@dataclass(frozen=True, slots=True)
class SignalDependency:
    """A declared dependency of a signal on another artifact, by identity."""

    kind: DependencyKind
    target: Ref


class SignalDependencyService(Protocol):
    """Declares and lists signal dependencies. Interface only — hidden dependencies are PROHIBITED."""

    def declare(self, signal: EntityId, dependency: SignalDependency) -> None: ...
PY
sgreadme "$D" "dependencies" \
"Define SignalDependency, DependencyKind, and SignalDependencyService: declared links to features, experiments, backtests, risk, and upstream signals." \
"Represent cross-context dependencies by identity only; declare all dependencies explicitly; never breach the isolation barrier; hold no logic." \
"Consumed by model (evidence), governance, repositories; connects to Feature/Experiment/Backtesting/Risk by reference." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (SE-2, AC-1/3, AD-3); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; P2-07."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Model — the canonical signal aggregate and value objects (data only).

Reuses core_domain.signal.SignalSpec (declarative, net-of-cost). The signal references all upstream
evidence by identity for full traceability; it holds NO generation algorithm.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, Version
from core_domain.signal import SignalSpec

from signal_service.classification import SignalClassification
from signal_service.status import SignalStatus


class SignalPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True, slots=True)
class SignalIdentifier:
    """A stable, versioned identity for a signal (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class SignalEvidence:
    """Traceable evidence references for a signal (by identity, not computed).

    A signal is standardized only from validated features, experiment evidence, backtest results, and
    an APPROVED Risk assessment (mandatory, RS-1) — all referenced by identity (full traceability).
    """

    feature_ref: Ref        # -> feature_service (canonical feature source)
    experiment_ref: Ref     # -> experiment_service (canonical experiment source)
    backtest_ref: Ref       # -> backtesting_service (canonical performance evidence)
    risk_approval_ref: Ref  # -> risk_service approved assessment (mandatory approval, RS-1)


@dataclass(eq=False)
class Signal(AggregateRoot):
    """A standardized investment signal (aggregate root).

    Deterministic and net-of-cost (AD-1). It is NOT portfolio construction and NOT execution; it holds
    no generation algorithm. It never activates without a mandatory Risk approval (RS-1).
    """

    identifier: SignalIdentifier
    spec: SignalSpec  # declarative, net-of-cost (reused from core_domain.signal)
    classification: SignalClassification
    priority: SignalPriority
    evidence: SignalEvidence
    status: SignalStatus
    provenance: Provenance
PY
sgreadme "$D" "model" \
"Define the canonical signal models: Signal (aggregate), SignalIdentifier, SignalEvidence, SignalPriority (reusing core SignalSpec)." \
"Represent a signal as an immutable, deterministic, net-of-cost aggregate that references all upstream evidence by identity (traceability); hold no generation algorithm, no portfolio/execution logic." \
"Consumed by every Signal Engine module; references Feature/Experiment/Backtesting/Risk by identity; reuses core_domain.signal." \
"core_domain.signal (SignalSpec); core_domain.shared (AggregateRoot, Provenance, Ref, Version); classification; status." \
"CLAUDE.md (AD-1/3, RS-1, CP-2/5/7, NM-2); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; Signal Registry; P2-07."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Metadata — the immutable, auditable metadata of a signal (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from signal_service.classification import SignalClassification
from signal_service.model import SignalIdentifier, SignalPriority
from signal_service.status import SignalStatus


@dataclass(frozen=True, slots=True)
class SignalMetadata:
    """Immutable metadata for a signal (auditable, provenance-bearing)."""

    identifier: SignalIdentifier
    description: str
    owner_role: str
    classification: SignalClassification
    status: SignalStatus
    priority: SignalPriority
    provenance: Provenance
    tags: tuple[str, ...]
PY
sgreadme "$D" "metadata" \
"Define SignalMetadata: the immutable, auditable, provenance-bearing metadata of a signal." \
"Carry signal metadata (identity, description, owner, classification, status, priority, provenance, tags) as data; hold no logic." \
"Consumed by management and repositories." \
"core_domain.shared (Provenance); model; classification; status." \
"CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry."

# ===========================================================================
# generation
# ===========================================================================
D="$SRC/generation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Generation — the deterministic generation coordination INTERFACE (no algorithm here).

Coordinates standardizing a validated research output into a signal via the deterministic engine. It
runs NO generation algorithm, is net-of-cost (AD-1), and never observes per-candidate validation/OOS
outcomes (isolation barrier, AD-3, P2-07).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.decision import SignalDecision


class SignalGenerationService(Protocol):
    """Coordinates deterministic signal generation from validated evidence. Interface only.

    It yields a deterministic decision to generate (or reject); it runs no algorithm and no ML, is
    net-of-cost, and does not observe validation/OOS outcomes.
    """

    def generate(self, subject: EntityId) -> SignalDecision: ...
PY
sgreadme "$D" "generation" \
"Define SignalGenerationService: coordinate deterministic signal generation from validated evidence." \
"Coordinate standardizing a validated output into a signal via the deterministic engine; run no algorithm/ML; net-of-cost; never observe validation/OOS; hold no logic." \
"core_domain.shared (EntityId); decision (SignalDecision); consumes validated features/experiment/backtest evidence." \
"Consumed by management; the deterministic generation engine plugs in behind the interface." \
"CLAUDE.md (AD-1/3, DE-1, AI-1); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; P2-07."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Validation Coordination — orchestrates validation via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the signal to the deterministic
Validation engine. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class SignalValidationCoordinator(Protocol):
    """Coordinates a signal's validation before APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; significance and the promotion
    decision are the deterministic Validation engine's (P2-*).
    """

    def request_validation(self, signal: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, signal: EntityId) -> ValidationReport: ...
PY
sgreadme "$D" "validation_coordination" \
"Define SignalValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation engine." \
"Coordinate validation; defer significance and promotion to the deterministic engine; assert no significance; hold no logic." \
"core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to APPROVED." \
"CLAUDE.md (AI-2, DE-1, VS-1); Architecture V2 §5.5, §5.6, §6.3; RB-04 · VAL; RB-09/10 · FAR."

# ===========================================================================
# approval
# ===========================================================================
D="$SRC/approval"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Approval — approval model + INTERFACE requiring MANDATORY Risk approval (RS-1)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class SignalApproval:
    """Records that a signal cleared validation AND holds an approved Risk assessment (mandatory).

    A signal MUST NOT be ACTIVE without an approved Risk assessment (RS-1); no AI approves (AI-3).
    """

    validated: bool
    risk_approval_ref: Ref  # -> approved Risk assessment (risk_service)
    approver_role: str


class SignalApprovalService(Protocol):
    """Approves a signal for activation ONLY after validation AND a mandatory Risk approval. Interface only."""

    def approve(self, signal: EntityId) -> None: ...
    def reject(self, signal: EntityId, reason: str) -> None: ...
PY
sgreadme "$D" "approval" \
"Define SignalApproval and SignalApprovalService: approval requiring validation AND a mandatory Risk approval." \
"Record approval only when validated and holding an approved Risk assessment (RS-1); no AI approves; hold no logic." \
"core_domain.shared (EntityId, Ref); requires an approved Risk assessment from the Risk Engine." \
"Consumed by lifecycle/management; gates activation." \
"CLAUDE.md (RS-1, AI-3, PS-1, HO-2); Architecture V2 §5.5, §5.7, §6.3; RB-13 · RISK; RB-09/10 · FAR."

# ===========================================================================
# registry_integration
# ===========================================================================
D="$SRC/registry_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Registry Integration — the port to the Signal Registry (register-before-use; no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.model import Signal


class SignalRegistryPort(Protocol):
    """The port to the Signal Registry. Interface only — the concrete registry stores elsewhere.

    Registration is append-only and immutable; a change creates a new version. A signal is published
    active only after validation and mandatory Risk approval (RS-1).
    """

    def register(self, signal: Signal) -> None: ...
    def publish_active(self, signal: EntityId) -> None: ...
    def is_registered(self, signal: EntityId) -> bool: ...
PY
sgreadme "$D" "registry_integration" \
"Define SignalRegistryPort: the integration port to the Signal Registry." \
"Integrate register-before-use, immutable/versioned registration and active publication as an interface; hold no persistence." \
"Consumed by management; delegates to core_domain.signal repositories and the Signal Registry." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (RS-1, CP-2/7, RL-2); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry."

# ===========================================================================
# governance
# ===========================================================================
D="$SRC/governance"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Governance — the deterministic governance-enforcement INTERFACE for signals (no logic).

Enforces: mandatory Risk approval before ACTIVE (RS-1), net-of-cost (AD-1), the isolation barrier
(AD-3), and no portfolio-construction / no execution authority (boundary). Enforcement is deterministic.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class SignalGovernanceService(Protocol):
    """Deterministically checks a signal's governance compliance. Interface only.

    Compliance requires: validated, mandatory Risk approval present, net-of-cost, isolation-compliant,
    and no portfolio/execution overreach.
    """

    def is_governance_compliant(self, signal: EntityId) -> bool: ...
    def requires_risk_approval(self, signal: EntityId) -> bool: ...
PY
sgreadme "$D" "governance" \
"Define SignalGovernanceService: deterministic enforcement of signal governance (mandatory Risk approval, net-of-cost, isolation, no portfolio/execution)." \
"Check governance compliance deterministically; enforce mandatory Risk approval, net-of-cost, and isolation; hold no logic." \
"Depends on an approved Risk assessment; consumed by management/approval; enforces the signal boundaries." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-1, AD-1/3, PS-1, DE-1); Architecture V2 §5.5, §6.1, §6.3; RB-13 · RISK; RB-09/10 · FAR; P2-07."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Management — the Signal Engine application/service INTERFACES (deterministic; no overreach).

Orchestrates the signal lifecycle and gates activation on validation + mandatory Risk approval. It is
deterministic, net-of-cost, and holds NO portfolio-construction or execution authority. No AI/ML decides.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.decision import SignalDecision
from signal_service.metadata import SignalMetadata


class SignalService(Protocol):
    """The Signal Engine service (interface only): drive the signal lifecycle."""

    def generate(self, subject: EntityId) -> EntityId: ...
    def submit_for_validation(self, signal: EntityId) -> None: ...
    def approve(self, signal: EntityId) -> None: ...
    def activate(self, signal: EntityId) -> None: ...
    def supersede(self, old: EntityId, new: EntityId) -> None: ...
    def retire(self, signal: EntityId) -> None: ...


class SignalEngineService(Protocol):
    """The deterministic signal decision gate: yields a SignalDecision for a subject. Interface only."""

    def decide(self, subject: EntityId) -> SignalDecision: ...


class SignalCatalogService(Protocol):
    """Describes signals from the catalog/registry. Interface only."""

    def describe(self, signal: EntityId) -> SignalMetadata: ...
PY
sgreadme "$D" "management" \
"Define the Signal Engine service interfaces: SignalService (lifecycle), SignalEngineService (deterministic decision gate), SignalCatalogService." \
"Orchestrate the signal lifecycle and gate activation on validation + mandatory Risk approval; deterministic and net-of-cost; hold no portfolio-construction, execution authority, or ML." \
"Top-level module: composes model, generation, validation/approval/governance, scoring/ranking, registry." \
"core_domain.shared (EntityId); decision; metadata." \
"CLAUDE.md (AD-1, RS-1, DE-1, AI-1, PS-1); Architecture V2 §5.5, §6.3; RB-09/10 · FAR; RB-13 · RISK; Signal Registry."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Policies — deterministic policy INTERFACES governing signals (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class SignalPolicy(Protocol):
    """Marker for a deterministic, versioned signal policy."""

    ...


class DeterministicDecisionPolicy(Protocol):
    """Signal decisions are deterministic; no ML/LLM decides (DE-1, AI-1). Interface only."""

    def is_deterministic(self, signal: EntityId) -> bool: ...


class NetOfCostPolicy(Protocol):
    """Signals are net-of-cost; gross selection is PROHIBITED (AD-1). Interface only."""

    def is_net_of_cost(self, signal: EntityId) -> bool: ...


class MandatoryRiskApprovalPolicy(Protocol):
    """A signal is never ACTIVE without an approved Risk assessment (RS-1). Interface only."""

    def has_risk_approval(self, signal: EntityId) -> bool: ...


class IsolationBarrierPolicy(Protocol):
    """Signal generation MUST NOT observe validation/OOS outcomes (AD-3, P2-07). Interface only."""

    def may_observe(self, signal: EntityId, resource: str) -> bool: ...


class NoPortfolioConstructionPolicy(Protocol):
    """The Signal Engine never constructs portfolios (boundary). Interface only."""

    def is_signal_only(self, signal: EntityId) -> bool: ...


class NoExecutionAuthorityPolicy(Protocol):
    """The Signal Engine holds no execution authority (boundary). Interface only."""

    def has_no_execution_authority(self, signal: EntityId) -> bool: ...
PY
sgreadme "$D" "policies" \
"Define the deterministic signal policy interfaces: SignalPolicy, DeterministicDecisionPolicy, NetOfCostPolicy, MandatoryRiskApprovalPolicy, IsolationBarrierPolicy, NoPortfolioConstructionPolicy, NoExecutionAuthorityPolicy." \
"Express the signal-governance rules (deterministic decisions, net-of-cost, mandatory Risk approval, isolation, no portfolio/execution) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by governance/management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (DE-1, AI-1, AD-1/3, RS-1, PS-1); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; RB-13 · RISK; P2-07."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Specifications — composable STRUCTURAL predicates over signals (no algorithm/formula).

These check structural readiness/governance prerequisites (validated, risk-approved, net-of-cost,
evidence present), NOT scores/ranks — those are the deterministic engines' outputs.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TSignal = TypeVar("TSignal", contravariant=True)


class SignalSpecification(Protocol[TSignal]):
    """A composable, deterministic structural predicate over a signal. Interface only."""

    def is_satisfied_by(self, signal: TSignal) -> bool: ...


class ReadyForActivationSpecification(Protocol[TSignal]):
    """Structural readiness for activation (validated, risk-approved, net-of-cost, registered).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, signal: TSignal) -> bool: ...


class GovernanceCompliantSpecification(Protocol[TSignal]):
    """Structural governance compliance (evidence present, isolation-compliant, no overreach). Interface only."""

    def is_satisfied_by(self, signal: TSignal) -> bool: ...
PY
sgreadme "$D" "specifications" \
"Define composable STRUCTURAL signal specifications: SignalSpecification, ReadyForActivationSpecification, GovernanceCompliantSpecification." \
"Express reusable, composable structural readiness/governance predicates; never compute scores/ranks or decide; hold no logic." \
"Composed by management/governance; scores/ranks are the deterministic engines' outputs." \
"Standard library only." \
"CLAUDE.md (DE-1, AD-1, RS-1, SE-3); Architecture V2 §5.5, §6.3; RB-09/10 · FAR."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Domain Events — immutable facts about a signal (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class SignalGenerated(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided)."""

    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalApproved(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalRejected(DomainEvent):
    signal_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class SignalActivated(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalSuperseded(DomainEvent):
    signal_id: EntityId
    superseded_by: EntityId


@dataclass(frozen=True, slots=True)
class SignalRetired(DomainEvent):
    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalScoreUpdated(DomainEvent):
    signal_id: EntityId
    score: float


@dataclass(frozen=True, slots=True)
class SignalRegistryUpdated(DomainEvent):
    signal_id: EntityId
PY
sgreadme "$D" "events" \
"Define the canonical signal domain events: SignalGenerated, SignalValidated, SignalApproved, SignalRejected, SignalActivated, SignalSuperseded, SignalRetired, SignalScoreUpdated, SignalRegistryUpdated." \
"Represent signal lifecycle facts as immutable domain events; SignalValidated records a deterministic-engine outcome." \
"core_domain.shared (DomainEvent, EntityId); align with core_domain.signal events." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, RS-1); Architecture V2 §5.5, §5.10; RB-09/10 · FAR; Signal Registry."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Errors — Signal Engine domain errors (each expresses a violated signal invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class SignalError(DomainError):
    """Base for Signal Engine errors."""


class SignalMissingRiskApproval(SignalError):
    """A signal was activated without a mandatory approved Risk assessment (RS-1, PS-1)."""


class GrossSignalSelection(SignalError):
    """A signal was selected on gross (pre-cost) performance (AD-1, AP-10)."""


class GeneratorObservedValidation(SignalError):
    """Signal generation observed validation/OOS outcomes (AD-3, P2-07)."""


class MLSignalDecision(SignalError):
    """An ML/LLM attempted to decide a signal (DE-1, AI-1)."""


class PortfolioConstructionAttempt(SignalError):
    """The Signal Engine attempted portfolio construction (out of scope, boundary)."""


class ExecutionAuthorityAttempt(SignalError):
    """The Signal Engine attempted execution or to authorize execution (out of scope, boundary)."""


class SignalNotRegistered(SignalError):
    """A signal was used/activated before registration in the Signal Registry (register-before-use)."""


class IllegalSignalTransition(SignalError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(SignalError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
PY
sgreadme "$D" "errors" \
"Define the Signal Engine errors: SignalMissingRiskApproval, GrossSignalSelection, GeneratorObservedValidation, MLSignalDecision, PortfolioConstructionAttempt, ExecutionAuthorityAttempt, SignalNotRegistered, IllegalSignalTransition, UndeclaredDependency." \
"Express violated signal invariants (mandatory Risk approval, net-of-cost, isolation, deterministic decision, no portfolio/execution, register-before-use, lifecycle, declared dependencies) as errors." \
"Used across the Signal Engine modules." \
"core_domain.shared (DomainError); aligns with core_domain.signal errors." \
"CLAUDE.md (RS-1, AD-1/3, DE-1, AI-1, PS-1, SE-2); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; RB-13 · RISK; P2-07."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Signal Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.dependencies import SignalDependency
from signal_service.model import Signal
from signal_service.scoring import SignalScore


class SignalRepositoryContract(Protocol):
    """Append-only repository of signals (immutable; supersede, never mutate, CP-2)."""

    def get(self, signal: EntityId) -> Signal: ...
    def add(self, signal: Signal) -> None: ...


class SignalScoreRepository(Protocol):
    """Append-only repository of immutable signal scores. Interface only."""

    def get(self, signal: EntityId) -> SignalScore: ...
    def add(self, signal: EntityId, score: SignalScore) -> None: ...


class SignalDependencyRepository(Protocol):
    """Retrieval of a signal's declared dependencies. Interface only."""

    def dependencies_of(self, signal: EntityId) -> tuple[SignalDependency, ...]: ...
PY
sgreadme "$D" "repositories" \
"Define the Signal Engine repository interfaces: SignalRepositoryContract (append-only), SignalScoreRepository, SignalDependencyRepository." \
"Express append-only, immutable retrieval of signals, scores, and dependencies as interfaces; hold no persistence." \
"Consumed by management; complements core_domain.signal repositories and the Signal Registry." \
"core_domain.shared (EntityId); model; scoring; dependencies." \
"CLAUDE.md (CP-2, RL-2, DP-1); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry."

echo "Signal Engine generated."
