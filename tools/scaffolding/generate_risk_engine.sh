#!/usr/bin/env bash
#
# generate_risk_engine.sh — Phase 2.6 Risk Engine generator.
#
# Governed by: CLAUDE.md (RS-1..4, CP-5, AI-1, HO-2/3, DE-1/2, EXP-2, CP-2/7); Architecture V2 §5.7
#              (Risk Management Layer — independent oversight), §6.3; Implementation Roadmap Phase 4;
#              RB-13 · RISK; P1-03.
#
# Emits the Risk Engine under services/risk-service as `risk_service`: the risk assessment aggregate +
# lifecycle, assessment, policies, constraints, exposure governance, limit management, classification,
# approval, reporting, validation coordination, review, evaluation pipeline, service/repository
# interfaces, specifications, domain events, and errors. It reuses core_domain (risk context + shared
# kernel) and the Validation Foundation; it references Backtesting evidence by identity (SE-2).
#
# The Risk Engine is the DETERMINISTIC risk-governance gate for research outputs (before signal
# generation). It is INDEPENDENT of research/portfolio (RS-2, CP-5); its verdicts are DETERMINISTIC
# and no AI decides risk (RS-1, AI-1); it has NO execution authority. It is NOT portfolio optimization,
# NOT production execution, NOT broker risk. It contains NO numerical risk algorithms, NO VaR
# calculations, NO stress-testing algorithms, NO persistence, NO infrastructure, NO API. Deterministic,
# technology-independent, immutable, auditable, governance-compliant, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/risk-service"
SRC="$SVC/src/risk_service"
cd "$ROOT"

rreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# risk-service · $2

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

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
# risk-service — the deterministic research-side Risk Engine (Phase 2.6).
# Standard library + Phase-1/2 foundations only. No numerical-risk/VaR/stress/persistence/broker deps.
[project]
name = "risk-service"
version = "0.1.0"
description = "Risk Engine: deterministic risk-governance model, evaluation pipeline, and interfaces."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/risk_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# risk-service — Risk Engine implemented in Phase 2.6

This service contains the Risk Engine (the `risk_service` package): the risk assessment aggregate,
lifecycle, assessment, policies, constraints, exposure governance, limit management, classification,
approval, reporting, validation coordination, review, evaluation pipeline, service/repository
interfaces, specifications, domain events, and errors. Numerical risk algorithms, VaR calculations,
stress-testing algorithms, execution authority, broker integration, persistence, infrastructure, and
APIs remain forbidden here. Numerical computation plugs in behind the interfaces as deterministic,
golden-tested engines; execution belongs to the Execution Layer.
MD

cat > "$SVC/README.md" <<'MD'
# Risk Service — the Risk Engine (`risk_service`)

> **Phase 2.6 — Risk Engine (implemented).** The deterministic governance layer that evaluates
> research outputs against institutional risk policies **before they may progress to signal
> generation**. The authoritative source of truth for quantitative risk assessment within the
> research platform. **Governance model & interfaces only** — no numerical risk algorithms, no VaR/
> stress calculations, no execution authority, no broker integration, no infrastructure, no API.

## Purpose
Realize the **Risk Management Layer** (Architecture V2 §5.7) on the research side: an **independent**,
**deterministic** risk gate. Risk oversight is independent of research and portfolio (RS-2, CP-5);
risk verdicts are deterministic, versioned, and formally testable (RS-1); **no AI decides risk**
(AI-1). It reuses the Phase-1/2 foundations and enforces the Risk Management governance (RB-13).

## Authority & boundaries
The Risk Engine **assesses and decides deterministically**; it has **no execution authority**, no
broker integration, and no production-trading logic (those are the Execution Layer's). It contains
**no numerical risk algorithms, no VaR calculations, and no stress-testing algorithms** — those plug
in behind the interfaces as versioned, golden-tested deterministic engines (DE-1/2). It is **not**
portfolio optimization.

## What is here (Phase 2.6)
20 modules, each a subpackage with its own `README.md`:
`model` · `status` · `lifecycle` · `classification` · `constraints` · `limits` · `exposure` ·
`policies` · `assessment` · `pipeline` · `validation_coordination` · `reporting` · `review` ·
`approval` · `management` · `specifications` · `metadata` · `events` · `errors` · `repositories`.

- **Canonical models:** `RiskAssessment` (aggregate, reuses `core_domain.AggregateRoot`),
  `RiskIdentifier`, `RiskProfile`, `RiskConstraint`, `RiskPolicy`, `RiskLimit` (reused from
  `core_domain.risk`), `RiskExposure`, `RiskReport`, `RiskDecision`, `RiskEvidence`, `RiskMetadata`.
- **Lifecycle:** `REQUESTED → ASSESSING → VALIDATING → REVIEWED → APPROVED → ACTIVE → RETIRED`
  (+ `REJECTED`), supporting reassessment, constraint updates, policy revisions, and governed
  exception handling; skips forbidden (fail-closed).
- **Domain events:** `RiskAssessmentRequested`, `RiskAssessmentCompleted`, `RiskValidated`,
  `RiskApproved`, `RiskRejected`, `RiskConstraintViolated`, `RiskPolicyUpdated`, `RiskReportGenerated`.

## Integration (by identity / foundation)
- **Backtesting Engine** — the canonical source of performance evidence (`RiskEvidence.backtest_ref`, by identity).
- **Validation Foundation** (`platform_validation`) — `validation_coordination` orchestrates validation.
- **Risk Management governance** (RB-13) — enforced via policies/constraints/limits and the deterministic
  `core_domain.risk` engine (`RiskLimitEngine`, `RiskVerdict`).

## Boundary rules (verified)
- **Deterministic & independent:** `RiskDecision` carries a deterministic `RiskVerdict`;
  `DeterministicDecisionPolicy` + `AIRiskDecision` error (RS-1, AI-1); `IndependencePolicy` +
  `RiskIndependenceViolation` (RS-2, CP-5).
- **No execution authority:** `NoExecutionAuthorityPolicy` + `ExecutionAuthorityAttempt` error.
- **No numerical algorithms/VaR/stress:** a code scan confirms no `scipy`/`numpy`/`var`/`stress`
  computation, no `def calculate` — exposures/metrics are referenced values from the deterministic engine.
- **Immutable & auditable:** all models/records/events are `frozen` dataclasses (runtime
  `FrozenInstanceError`); repositories append-only; reports are explainable (EXP-2).
- **Compiles and imports cleanly**, 20 modules, no circular dependencies.

## Ownership
Accountable role: HPR (Head of Portfolio & Risk), independent of research. Architecture owner: ARB.

## Dependencies
`core-domain`, `platform-validation`.

## Regeneration
Generated by [`tools/scaffolding/generate_risk_engine.sh`](../../tools/scaffolding/generate_risk_engine.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (RS-1..4, CP-5, AI-1, HO-2/3, DE-1/2, EXP-2, CP-2/7); Architecture V2 §5.7, §6.3;
Implementation Roadmap Phase 4; RB-13 · RISK; `P1-03`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""risk_service — the deterministic research-side Risk Engine.

Evaluates research outputs against institutional risk policies before they may progress to signal
generation. It is the authoritative source of truth for quantitative risk assessment within the
research platform.

Authority (RS-1/2, CP-5, AI-1): risk oversight is INDEPENDENT of research/portfolio; risk verdicts
are DETERMINISTIC, versioned, and formally testable; NO AI decides risk. It reuses core_domain (risk
context + shared kernel) and platform_validation, references Backtesting evidence by identity, and
enforces the Risk Management governance (RB-13).

Boundaries: NOT portfolio optimization, NOT production execution, NOT broker risk. No numerical risk
algorithms, no VaR calculations, no stress-testing algorithms, no execution authority, no broker
integration, no persistence, no infrastructure, no API. Numerical computation plugs in behind the
interfaces as deterministic, golden-tested engines.

Modules: model, status, lifecycle, classification, constraints, limits, exposure, policies,
assessment, pipeline, validation_coordination, reporting, review, approval, management,
specifications, metadata, events, errors, repositories.
"""
from __future__ import annotations

from . import approval  # noqa: F401
PY
cat > "$SRC/__init__.py" <<'PY'
"""risk_service — the deterministic research-side Risk Engine.

Evaluates research outputs against institutional risk policies before they may progress to signal
generation. It is the authoritative source of truth for quantitative risk assessment within the
research platform.

Authority (RS-1/2, CP-5, AI-1): risk oversight is INDEPENDENT of research/portfolio; risk verdicts
are DETERMINISTIC, versioned, and formally testable; NO AI decides risk. It reuses core_domain (risk
context + shared kernel) and platform_validation, references Backtesting evidence by identity, and
enforces the Risk Management governance (RB-13).

Boundaries: NOT portfolio optimization, NOT production execution, NOT broker risk. No numerical risk
algorithms, no VaR calculations, no stress-testing algorithms, no execution authority, no broker
integration, no persistence, no infrastructure, no API. Numerical computation plugs in behind the
interfaces as deterministic, golden-tested engines.

Modules: model, status, lifecycle, classification, constraints, limits, exposure, policies,
assessment, pipeline, validation_coordination, reporting, review, approval, management,
specifications, metadata, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    approval,
    assessment,
    classification,
    constraints,
    errors,
    events,
    exposure,
    lifecycle,
    limits,
    management,
    metadata,
    model,
    pipeline,
    policies,
    reporting,
    repositories,
    review,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "classification", "constraints", "limits", "exposure",
    "policies", "assessment", "pipeline", "validation_coordination", "reporting", "review",
    "approval", "management", "specifications", "metadata", "events", "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class RiskLifecycle(Enum):
    """The canonical risk-assessment lifecycle (plus REJECTED)."""

    REQUESTED = "requested"
    ASSESSING = "assessing"
    VALIDATING = "validating"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    ACTIVE = "active"
    RETIRED = "retired"
    REJECTED = "rejected"


L = RiskLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[RiskLifecycle, RiskLifecycle], ...] = (
    (L.REQUESTED, L.ASSESSING),
    (L.ASSESSING, L.VALIDATING),
    (L.VALIDATING, L.REVIEWED),
    (L.REVIEWED, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.RETIRED),
    # reassessment (policy/constraint revision triggers a new assessment)
    (L.ACTIVE, L.ASSESSING),
    (L.APPROVED, L.ASSESSING),
    # rejection
    (L.VALIDATING, L.REJECTED),
    (L.REVIEWED, L.REJECTED),
    # governed exception re-review
    (L.APPROVED, L.REVIEWED),
    # retirement of a rejected assessment
    (L.REJECTED, L.RETIRED),
)

#: Terminal state.
TERMINAL_STATES: frozenset[RiskLifecycle] = frozenset({L.RETIRED})


class RiskLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/ACTIVE require the deterministic assessment + review;
    the service performs NO adjudication and no AI decides risk (RS-1, AI-1). Interface only."""

    def transition(self, assessment: EntityId, to: RiskLifecycle) -> None: ...
PY
rreadme "$D" "lifecycle" \
"Define RiskLifecycle (REQUESTED/ASSESSING/VALIDATING/REVIEWED/APPROVED/ACTIVE/RETIRED + REJECTED), the canonical transitions (reassessment/rejection/exception), and the lifecycle-service interface." \
"Enumerate the lifecycle and legal transitions as data; policy/constraint revision triggers reassessment; hold no logic and no AI decision." \
"Consumed by model, status, approval, review, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-1/2, AI-1, RL-1); Architecture V2 §5.7; RB-13 · RISK."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from risk_service.lifecycle import RiskLifecycle


@dataclass(frozen=True, slots=True)
class RiskStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: RiskLifecycle
    since: str
PY
rreadme "$D" "status" \
"Define RiskStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent risk-assessment status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (RiskLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.7; RB-13 · RISK."

# ===========================================================================
# classification
# ===========================================================================
D="$SRC/classification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Classification — the category/severity classification of a risk (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class RiskCategory(Enum):
    MARKET = "market"
    LIQUIDITY = "liquidity"
    CONCENTRATION = "concentration"
    LEVERAGE = "leverage"
    DRAWDOWN = "drawdown"
    MODEL = "model"
    OPERATIONAL = "operational"
    CROWDING = "crowding"


class RiskSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True, slots=True)
class RiskClassification:
    """The classification of a risk assessment (category + severity)."""

    category: RiskCategory
    severity: RiskSeverity
PY
rreadme "$D" "classification" \
"Define RiskClassification with RiskCategory and RiskSeverity enums." \
"Classify risk assessments by category and severity; data only." \
"Consumed by model, metadata, specifications." \
"Standard library only." \
"CLAUDE.md (RS-1, KM-3); Architecture V2 §5.7; RB-13 · RISK."

# ===========================================================================
# constraints
# ===========================================================================
D="$SRC/constraints"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Constraints — deterministic constraint value objects and management INTERFACE (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ConstraintSeverity(Enum):
    SOFT = "soft"   # a warning
    HARD = "hard"   # a hard constraint; breach blocks progression (RS-1)


@dataclass(frozen=True, slots=True)
class RiskConstraint:
    """A named, deterministic risk constraint; the evaluation is done by the deterministic engine.

    ``expression`` names the constraint (evaluated by an outer deterministic engine); no logic here.
    """

    name: str
    expression: str
    severity: ConstraintSeverity


class RiskConstraintService(Protocol):
    """Manages (versioned) risk constraints. Interface only; updates are governed."""

    def set_constraint(self, assessment: EntityId, constraint: RiskConstraint) -> None: ...
PY
rreadme "$D" "constraints" \
"Define RiskConstraint, ConstraintSeverity, and RiskConstraintService: deterministic risk constraints and their governed management." \
"Represent constraints as immutable data with a management interface; hold no evaluation logic (a deterministic engine evaluates them); hard-constraint breaches block progression." \
"Consumed by model (profile), pipeline, specifications." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-1, DE-1); Architecture V2 §5.7; RB-13 · RISK; P1-03."

# ===========================================================================
# limits
# ===========================================================================
D="$SRC/limits"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Limit Management — deterministic, versioned risk limits (reuses core_domain.risk.RiskLimit)."""
from __future__ import annotations

from typing import Protocol

from core_domain.risk import RiskLimit  # reuse the domain limit value object

from core_domain.shared import EntityId


class LimitManagementService(Protocol):
    """Manages deterministic, versioned risk limits (exposure/leverage/concentration/drawdown, RS-1).

    Limits are deterministic and formally testable; the deterministic RiskLimitEngine evaluates them.
    Interface only.
    """

    def set_limit(self, limit: RiskLimit) -> None: ...
    def get_limit(self, name: str) -> RiskLimit: ...
    def check(self, assessment: EntityId) -> bool: ...


__all__ = ["RiskLimit", "LimitManagementService"]
PY
rreadme "$D" "limits" \
"Define the LimitManagementService and re-export the deterministic RiskLimit (from core_domain.risk)." \
"Manage deterministic, versioned risk limits; delegate evaluation to the deterministic RiskLimitEngine; hold no numerical logic." \
"Consumed by model (profile), pipeline, exposure; reuses core_domain.risk.RiskLimit / RiskLimitEngine." \
"core_domain.risk (RiskLimit); core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-1, DE-1/2); Architecture V2 §5.7; RB-13 · RISK; P1-03."

# ===========================================================================
# exposure
# ===========================================================================
D="$SRC/exposure"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Exposure Governance — exposure value objects and governance INTERFACE (no VaR computation here).

Exposure values are MEASURED by the deterministic numerical engine and referenced here; this module
governs exposures against limits. It performs NO VaR/stress computation.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class RiskExposure:
    """A measured exposure governed against a limit.

    ``measure`` names the exposure (e.g. gross/net/concentration); ``value`` is a value supplied by the
    deterministic numerical engine — it is NOT computed here (no VaR/stress algorithms).
    """

    measure: str
    value: float
    limit_name: str


class ExposureGovernanceService(Protocol):
    """Governs measured exposures against deterministic limits. Interface only.

    It references measured exposures and evaluates them against limits deterministically; it computes
    no VaR/stress. A hard breach blocks progression (RS-1).
    """

    def evaluate_exposure(self, assessment: EntityId) -> RiskExposure: ...
PY
rreadme "$D" "exposure" \
"Define RiskExposure and ExposureGovernanceService: measured exposures governed against deterministic limits." \
"Govern exposures against limits; reference measured values (computed by the deterministic engine); compute no VaR/stress; hold no numerical logic." \
"Consumed by pipeline, reporting; evaluates against limits." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-1, DE-1); Architecture V2 §5.7; RB-13 · RISK; P1-03."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Policies — the versioned risk policy model and governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Version


@dataclass(frozen=True, slots=True)
class RiskPolicy:
    """A named, versioned, deterministic risk policy (RB-13). Immutable; a change is a new version."""

    name: str
    version: Version
    description: str


class RiskPolicyService(Protocol):
    """Governs risk-policy revisions (recorded, versioned). Interface only; a revision triggers reassessment."""

    def update_policy(self, policy: RiskPolicy) -> None: ...


class IndependencePolicy(Protocol):
    """Risk oversight is independent of research/portfolio (RS-2, CP-5). Interface only."""

    def is_independent(self, assessment: EntityId) -> bool: ...


class DeterministicDecisionPolicy(Protocol):
    """Risk verdicts are deterministic; an LLM MUST NEVER decide risk (RS-1, AI-1). Interface only."""

    def is_deterministic(self, assessment: EntityId) -> bool: ...


class NoExecutionAuthorityPolicy(Protocol):
    """The Risk Engine gates but NEVER executes or authorizes execution (boundary). Interface only."""

    def has_no_execution_authority(self, assessment: EntityId) -> bool: ...
PY
rreadme "$D" "policies" \
"Define RiskPolicy (versioned) and the governance policy interfaces: RiskPolicyService, IndependencePolicy, DeterministicDecisionPolicy, NoExecutionAuthorityPolicy." \
"Represent versioned risk policies and express the governance rules (independence, deterministic decisions, no execution authority) as interfaces; hold no logic." \
"Consumed by model (profile), pipeline, management; enforced by deterministic engines." \
"core_domain.shared (EntityId, Version); standard library." \
"CLAUDE.md (RS-1/2, CP-5, AI-1, VER-1); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Model — the canonical risk-assessment aggregate and value objects (data only).

Reuses core_domain.risk (RiskVerdict) for the deterministic verdict. It references performance
evidence (Backtesting Engine) and the subject under assessment by identity.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.risk import RiskVerdict
from core_domain.shared import AggregateRoot, Provenance, Ref, Version

from risk_service.classification import RiskClassification
from risk_service.constraints import RiskConstraint
from risk_service.limits import RiskLimit
from risk_service.status import RiskStatus


@dataclass(frozen=True, slots=True)
class RiskIdentifier:
    """A stable, versioned identity for a risk assessment (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class RiskProfile:
    """The deterministic risk profile: the constraints and limits applied to a subject."""

    constraints: tuple[RiskConstraint, ...]
    limits: tuple[RiskLimit, ...]


@dataclass(frozen=True, slots=True)
class RiskEvidence:
    """Performance evidence referenced from the Backtesting Engine (not computed here)."""

    summary: str
    backtest_ref: Ref  # -> backtesting_service result (canonical performance evidence)


@dataclass(frozen=True, slots=True)
class RiskDecision:
    """A deterministic risk verdict with an explainable rationale (RS-1, EXP-2).

    An LLM MUST NEVER decide risk (AI-1); the verdict is produced by a deterministic engine.
    """

    verdict: RiskVerdict
    rationale: str


@dataclass(eq=False)
class RiskAssessment(AggregateRoot):
    """A risk assessment of a research output (aggregate root).

    Independent of research/portfolio (RS-2, CP-5); deterministic; it gates progression to signal
    generation but holds NO execution authority.
    """

    identifier: RiskIdentifier
    subject: Ref  # -> the research output (signal candidate / strategy) under assessment
    evidence: RiskEvidence
    profile: RiskProfile
    classification: RiskClassification
    decision: RiskDecision | None  # None until the deterministic engine decides
    status: RiskStatus
    provenance: Provenance
PY
rreadme "$D" "model" \
"Define the canonical risk models: RiskAssessment (aggregate), RiskIdentifier, RiskProfile, RiskDecision, RiskEvidence (reusing core RiskVerdict; RiskConstraint/RiskLimit)." \
"Represent a risk assessment as an immutable, deterministic, independent aggregate that references performance evidence and its subject by identity; hold no numerical logic, no adjudication by AI." \
"Consumed by every Risk Engine module; references Backtesting evidence by identity; reuses core_domain.risk." \
"core_domain.risk (RiskVerdict); core_domain.shared (AggregateRoot, Provenance, Ref, Version); classification; constraints; limits; status." \
"CLAUDE.md (RS-1/2, CP-2/5/7, AI-1, EXP-2, NM-2); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Metadata — the immutable, auditable metadata of a risk assessment (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from risk_service.classification import RiskClassification
from risk_service.model import RiskIdentifier
from risk_service.status import RiskStatus


@dataclass(frozen=True, slots=True)
class RiskMetadata:
    """Immutable metadata for a risk assessment (auditable, provenance-bearing)."""

    identifier: RiskIdentifier
    description: str
    owner_role: str  # independent risk owner (RS-2)
    classification: RiskClassification
    status: RiskStatus
    provenance: Provenance
    tags: tuple[str, ...]
PY
rreadme "$D" "metadata" \
"Define RiskMetadata: the immutable, auditable, provenance-bearing metadata of a risk assessment." \
"Carry risk metadata (identity, description, independent owner, classification, status, provenance, tags) as data; hold no logic." \
"Consumed by management and repositories." \
"core_domain.shared (Provenance); model; classification; status." \
"CLAUDE.md (CP-7, RS-2); Architecture V2 §5.7; RB-13 · RISK."

# ===========================================================================
# assessment
# ===========================================================================
D="$SRC/assessment"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Assessment — the deterministic assessment coordination INTERFACE (no numerical logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RiskAssessmentService(Protocol):
    """Coordinates a deterministic risk assessment of a research output. Interface only.

    Independent of research/portfolio (RS-2); the verdict is produced deterministically (RS-1); no AI
    decides (AI-1). It consumes performance evidence from the Backtesting Engine; it computes no
    numerical risk itself (that is the deterministic numerical engine behind the interface).
    """

    def request_assessment(self, subject: EntityId) -> EntityId: ...
    def complete_assessment(self, assessment: EntityId) -> None: ...
PY
rreadme "$D" "assessment" \
"Define RiskAssessmentService: coordinate a deterministic, independent risk assessment of a research output." \
"Coordinate assessment against policies/constraints/limits using Backtesting evidence; produce a deterministic verdict; compute no numerical risk; hold no logic." \
"core_domain.shared (EntityId); consumes Backtesting evidence; produces the model.RiskAssessment." \
"Consumed by management; precedes validation/review/approval." \
"CLAUDE.md (RS-1/2, AI-1, DE-1); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03."

# ===========================================================================
# pipeline
# ===========================================================================
D="$SRC/pipeline"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Evaluation Pipeline — a composable, deterministic pipeline of risk checks (no numerical logic).

Composes constraint, limit, exposure, and policy checks into a deterministic evaluation that yields a
RiskDecision. It runs NO numerical VaR/stress algorithms — those plug in behind the check interfaces.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId

from risk_service.model import RiskDecision


class RiskCheckKind(Enum):
    CONSTRAINT = "constraint"
    LIMIT = "limit"
    EXPOSURE = "exposure"
    POLICY = "policy"


@dataclass(frozen=True, slots=True)
class RiskEvaluationStage:
    """One deterministic stage of the risk evaluation pipeline."""

    name: str
    kind: RiskCheckKind
    blocking: bool  # a blocking hard-check failure stops progression (RS-1)


@dataclass(frozen=True, slots=True)
class RiskEvaluationPlan:
    """A declarative, composable plan of risk-evaluation stages."""

    stages: tuple[RiskEvaluationStage, ...]


class RiskEvaluationPipeline(Protocol):
    """Runs the deterministic risk-evaluation pipeline, yielding a deterministic RiskDecision. Interface only."""

    def evaluate(self, assessment: EntityId, plan: RiskEvaluationPlan) -> RiskDecision: ...
PY
rreadme "$D" "pipeline" \
"Define RiskEvaluationPlan, RiskEvaluationStage, RiskCheckKind, and the RiskEvaluationPipeline interface: a composable, deterministic pipeline of risk checks." \
"Compose constraint/limit/exposure/policy checks into a deterministic evaluation yielding a RiskDecision; run no numerical VaR/stress; hold no logic." \
"core_domain.shared (EntityId); model (RiskDecision); composes constraints/limits/exposure/policies." \
"Consumed by assessment/management." \
"CLAUDE.md (RS-1, DE-1, SE-3); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Validation Coordination — orchestrates validation of the risk assessment via the Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes model-risk validation to the
deterministic engine. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class RiskValidationCoordinator(Protocol):
    """Coordinates a risk assessment's validation before REVIEWED/APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; statistical model-risk
    validation is the deterministic engine's; it asserts no significance.
    """

    def request_validation(self, assessment: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, assessment: EntityId) -> ValidationReport: ...
PY
rreadme "$D" "validation_coordination" \
"Define RiskValidationCoordinator: orchestrate structural validation (Validation Foundation) and route model-risk validation to the deterministic engine." \
"Coordinate validation; defer significance to the deterministic engine; assert no significance; hold no logic." \
"core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to REVIEWED." \
"CLAUDE.md (AI-2, DE-1, VS-1); Architecture V2 §5.7, §5.6, §6.3; RB-04 · VAL; RB-13 · RISK."

# ===========================================================================
# reporting
# ===========================================================================
D="$SRC/reporting"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Reporting — the risk report model and reporting INTERFACE (explainable; references only)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId

from risk_service.exposure import RiskExposure
from risk_service.model import RiskDecision


@dataclass(frozen=True, slots=True)
class RiskReport:
    """An immutable, explainable risk report (EXP-2).

    It references the deterministic decision, measured exposures, and any breaches; it computes no
    numerical risk.
    """

    assessment_id: EntityId
    decision: RiskDecision
    exposures: tuple[RiskExposure, ...]
    breaches: tuple[str, ...]


class RiskReportingService(Protocol):
    """Generates an immutable, explainable risk report from an assessment. Interface only."""

    def generate(self, assessment: EntityId) -> RiskReport: ...
PY
rreadme "$D" "reporting" \
"Define RiskReport and RiskReportingService: the immutable, explainable risk report and its generation." \
"Aggregate the deterministic decision, measured exposures, and breaches into an explainable report; compute no numerical risk; hold no logic." \
"core_domain.shared (EntityId); model (RiskDecision); exposure (RiskExposure)." \
"Consumed by review/management/governance." \
"CLAUDE.md (EXP-2, CP-7, RS-1); Architecture V2 §5.7; RB-13 · RISK."

# ===========================================================================
# review
# ===========================================================================
D="$SRC/review"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Review — the independent (2nd-line) risk review INTERFACE and governed exception handling."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RiskReviewService(Protocol):
    """Independent risk review of a deterministic assessment (RS-2, 2nd line). Interface only.

    It is independent of research/portfolio; it handles governed exceptions with recorded rationale
    (HO-2); an exception MUST NOT bypass a hard risk control (HO-3).
    """

    def review(self, assessment: EntityId) -> None: ...
    def request_exception(self, assessment: EntityId, rationale: str) -> None: ...
PY
rreadme "$D" "review" \
"Define RiskReviewService: independent (2nd-line) risk review and governed exception handling." \
"Provide independent review of the deterministic assessment; handle governed, recorded exceptions; never bypass a hard control; hold no logic." \
"core_domain.shared (EntityId); reviews the model.RiskAssessment." \
"Consumed by management; precedes approval." \
"CLAUDE.md (RS-2, HO-2/3, CP-5); Architecture V2 §5.7, §6.2; RB-13 · RISK."

# ===========================================================================
# approval
# ===========================================================================
D="$SRC/approval"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Approval — the independent risk sign-off INTERFACE (follows the deterministic verdict)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RiskApprovalService(Protocol):
    """Records the independent risk sign-off at promotion (RS-2). Interface only.

    Approval follows the deterministic verdict and independent review; no AI approves (AI-3); an
    override MUST NOT be used to bypass statistical/risk enforcement (HO-3).
    """

    def approve(self, assessment: EntityId) -> None: ...
    def reject(self, assessment: EntityId, reason: str) -> None: ...
PY
rreadme "$D" "approval" \
"Define RiskApprovalService: record independent risk sign-off / rejection at promotion." \
"Record approval as an independent sign-off following the deterministic verdict; no AI approves; overrides never bypass controls; hold no logic." \
"Follows review; gates promotion to signal generation; independent of research/portfolio (RS-2)." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-2, AI-3, HO-2/3, CP-5); Architecture V2 §5.7, §6.2; RB-13 · RISK; P2-09."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Management — the Risk Engine application/service INTERFACES (deterministic gate, no execution).

Orchestrates the risk lifecycle and gates research outputs before signal generation. It is
independent (RS-2), deterministic (RS-1), and holds NO execution authority. No AI decides risk (AI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from risk_service.metadata import RiskMetadata
from risk_service.model import RiskDecision


class RiskService(Protocol):
    """The Risk Engine service (interface only): drive the risk-assessment lifecycle."""

    def request_assessment(self, subject: EntityId) -> EntityId: ...
    def assess(self, assessment: EntityId) -> None: ...
    def submit_for_validation(self, assessment: EntityId) -> None: ...
    def submit_for_review(self, assessment: EntityId) -> None: ...
    def approve(self, assessment: EntityId) -> None: ...
    def activate(self, assessment: EntityId) -> None: ...
    def retire(self, assessment: EntityId) -> None: ...


class RiskEngineService(Protocol):
    """The deterministic risk gate: yields a RiskDecision for a subject. Interface only.

    It gates progression to signal generation; it never executes and no AI decides (RS-1, AI-1).
    """

    def decide(self, subject: EntityId) -> RiskDecision: ...


class RiskCatalogService(Protocol):
    """Describes risk assessments from the catalog. Interface only."""

    def describe(self, assessment: EntityId) -> RiskMetadata: ...
PY
rreadme "$D" "management" \
"Define the Risk Engine service interfaces: RiskService (lifecycle), RiskEngineService (the deterministic gate), RiskCatalogService." \
"Orchestrate the risk lifecycle and gate research outputs before signal generation deterministically; hold no execution authority, no numerical logic, no AI decision." \
"Top-level module: composes model, pipeline, assessment, validation/review/approval; gates signal generation." \
"core_domain.shared (EntityId); model; metadata." \
"CLAUDE.md (RS-1/2, AI-1, DE-1, CP-5); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03, P2-09."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Specifications — composable STRUCTURAL predicates over risk assessments (no numerical logic).

These check structural governance prerequisites (has evidence, profile, independent owner), NOT
numerical risk levels — those are the deterministic engine's evaluation.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TRisk = TypeVar("TRisk", contravariant=True)


class RiskSpecification(Protocol[TRisk]):
    """A composable, deterministic structural predicate over a risk assessment. Interface only."""

    def is_satisfied_by(self, assessment: TRisk) -> bool: ...


class WithinGovernanceSpecification(Protocol[TRisk]):
    """Structural governance readiness (has evidence, profile, independent owner). Interface only."""

    def is_satisfied_by(self, assessment: TRisk) -> bool: ...


class PromotionEligibilitySpecification(Protocol[TRisk]):
    """Structural prerequisites for promotion to signal generation (assessed, validated, reviewed,
    approved). The promotion DECISION is the deterministic gate + independent sign-off, not this. Interface only.
    """

    def is_satisfied_by(self, assessment: TRisk) -> bool: ...
PY
rreadme "$D" "specifications" \
"Define composable STRUCTURAL risk specifications: RiskSpecification, WithinGovernanceSpecification, PromotionEligibilitySpecification." \
"Express reusable, composable structural governance predicates; never judge numerical risk or decide promotion; hold no logic." \
"Composed by management; the risk decision is the deterministic engine's + independent sign-off's." \
"Standard library only." \
"CLAUDE.md (DE-1, RS-1/2, SE-3); Architecture V2 §5.7, §6.3; RB-13 · RISK; P2-09."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Domain Events — immutable facts about a risk assessment (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class RiskAssessmentRequested(DomainEvent):
    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskAssessmentCompleted(DomainEvent):
    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided)."""

    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskApproved(DomainEvent):
    assessment_id: EntityId


@dataclass(frozen=True, slots=True)
class RiskRejected(DomainEvent):
    assessment_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class RiskConstraintViolated(DomainEvent):
    assessment_id: EntityId
    constraint: str


@dataclass(frozen=True, slots=True)
class RiskPolicyUpdated(DomainEvent):
    policy: str


@dataclass(frozen=True, slots=True)
class RiskReportGenerated(DomainEvent):
    assessment_id: EntityId
PY
rreadme "$D" "events" \
"Define the canonical risk domain events: RiskAssessmentRequested, RiskAssessmentCompleted, RiskValidated, RiskApproved, RiskRejected, RiskConstraintViolated, RiskPolicyUpdated, RiskReportGenerated." \
"Represent risk lifecycle facts as immutable domain events; RiskValidated records a deterministic-engine outcome." \
"core_domain.shared (DomainEvent, EntityId); align with core_domain.risk events." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, RS-1); Architecture V2 §5.7, §5.10; RB-13 · RISK."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Errors — Risk Engine domain errors (each expresses a violated risk-governance invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class RiskError(DomainError):
    """Base for Risk Engine errors."""


class AIRiskDecision(RiskError):
    """An AI attempted to decide a risk verdict/halt (RS-1, AI-1)."""


class RiskIndependenceViolation(RiskError):
    """Risk oversight was not independent of research/portfolio (RS-2, CP-5)."""


class HardConstraintBreach(RiskError):
    """A hard risk constraint/limit was breached; progression is blocked (RS-1)."""


class ExecutionAuthorityAttempt(RiskError):
    """The Risk Engine attempted execution or to authorize execution (out of scope, boundary)."""


class GovernanceBypass(RiskError):
    """An override attempted to bypass a hard risk control (HO-3; void)."""


class MissingPerformanceEvidence(RiskError):
    """A risk assessment lacked the required Backtesting performance evidence."""


class IllegalRiskTransition(RiskError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
PY
rreadme "$D" "errors" \
"Define the Risk Engine errors: AIRiskDecision, RiskIndependenceViolation, HardConstraintBreach, ExecutionAuthorityAttempt, GovernanceBypass, MissingPerformanceEvidence, IllegalRiskTransition." \
"Express violated risk-governance invariants (deterministic decision, independence, hard-limit breach, no execution authority, no control bypass, evidence-required, lifecycle) as errors." \
"Used across the Risk Engine modules." \
"core_domain.shared (DomainError); aligns with core_domain.risk errors." \
"CLAUDE.md (RS-1/2, AI-1, HO-3, CP-5); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Risk Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from risk_service.model import RiskAssessment
from risk_service.reporting import RiskReport


class RiskAssessmentRepositoryContract(Protocol):
    """Append-only repository of risk assessments (immutable; supersede, never mutate, CP-2)."""

    def get(self, assessment: EntityId) -> RiskAssessment: ...
    def add(self, assessment: RiskAssessment) -> None: ...


class RiskReportRepository(Protocol):
    """Append-only repository of immutable risk reports. Interface only."""

    def get(self, assessment: EntityId) -> RiskReport: ...
    def add(self, report: RiskReport) -> None: ...
PY
rreadme "$D" "repositories" \
"Define the Risk Engine repository interfaces: RiskAssessmentRepositoryContract (append-only), RiskReportRepository." \
"Express append-only, immutable retrieval of risk assessments and reports as interfaces; hold no persistence." \
"Consumed by management; complements core_domain.risk repositories." \
"core_domain.shared (EntityId); model; reporting." \
"CLAUDE.md (CP-2/7, RS-1); Architecture V2 §5.7; RB-13 · RISK."

echo "Risk Engine generated."
