#!/usr/bin/env bash
#
# generate_portfolio_engine.sh — Phase 2.8 Portfolio Engine generator.
#
# Governed by: CLAUDE.md (PS-1..4, RS-1, AD-1, CP-2/5/7, AI-1, DE-1, RP-1, RL-1/2); Architecture V2
#              §5.6 (Quantitative Engine Layer), §6.3; Implementation Roadmap Phase 4; RB-12 · PORT,
#              RB-13 · RISK; Portfolio Registry; P1-08.
#
# Emits the Portfolio Engine under services/portfolio-service as `portfolio_service`: the portfolio
# aggregate + candidate, lifecycle, construction, allocation, constraints, diversification, exposure,
# rebalancing, validation coordination, reporting, registry integration, optimization interface,
# service/repository interfaces, policies, specifications, domain events, and errors. It reuses
# core_domain (portfolio context + shared kernel) and the Validation Foundation; it references Signal/
# Risk by identity.
#
# The Portfolio Engine is the DETERMINISTIC construction layer that turns APPROVED signals into
# governed portfolio candidates. It consumes only capital-eligible signals (PS-1), is net-of-cost and
# constraint-respecting (PS-2), and NO LLM decides allocation/sizing (PS-3, AI-1). Every portfolio is
# an immutable snapshot with rationale (PS-4). It is NOT trade execution, NOT broker integration, NOT
# order management. It contains NO optimization algorithms, NO allocation mathematics, NO persistence,
# NO infrastructure, NO API. Deterministic, reproducible, technology-independent, immutable, auditable,
# idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/portfolio-service"
SRC="$SVC/src/portfolio_service"
cd "$ROOT"

# robust README helper: unset args default to empty (never aborts under set -u); a guard verifies completeness
pfreadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# portfolio-service · $name

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose
$purpose

## Responsibilities
$resp

## Relationships
$rel

## Dependencies
$deps

## Related Governance Documents
$gov
EOF
}

# ===========================================================================
# SERVICE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$SVC/pyproject.toml" <<'TOML'
# portfolio-service — the deterministic Portfolio Engine (Phase 2.8).
# Standard library + Phase-1/2 foundations only. No optimization/allocation-math/persistence/broker deps.
[project]
name = "portfolio-service"
version = "0.1.0"
description = "Portfolio Engine: deterministic portfolio construction model, optimizer interface, governance."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/portfolio_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# portfolio-service — Portfolio Engine implemented in Phase 2.8

This service contains the Portfolio Engine (the `portfolio_service` package): the portfolio aggregate,
candidate, lifecycle, construction, allocation, constraints, diversification, exposure, rebalancing,
validation coordination, reporting, registry integration, optimization interface, service/repository
interfaces, policies, specifications, domain events, and errors. Optimization algorithms, allocation
mathematics, trade execution, order management, broker/market connectivity, persistence, infrastructure,
and APIs remain forbidden here. The deterministic optimizer plugs in behind the interface; execution
belongs to the Execution Layer.
MD

cat > "$SVC/README.md" <<'MD'
# Portfolio Service — the Portfolio Engine (`portfolio_service`)

> **Phase 2.8 — Portfolio Engine (implemented).** The deterministic portfolio construction layer that
> transforms approved investment signals into governed portfolio candidates, enforcing portfolio
> construction principles, investment constraints, and institutional allocation policies. The
> authoritative source of truth for portfolio composition. **Construction model & interfaces only** —
> no optimization algorithms, no allocation mathematics, no trade execution, no order management, no
> broker/market connectivity, no infrastructure, no API.

## Purpose
Realize the Portfolio Optimizer of the **Quantitative Engine Layer** (Architecture V2 §5.6). It
consumes only **capital-eligible** signals (PS-1), constructs **net-of-cost, constraint-respecting**
portfolios (PS-2) **deterministically** — **no LLM decides allocation or sizing** (PS-3, AI-1) — and
produces **immutable snapshots with rationale** (PS-4). It reuses the Phase-1/2 foundations, enforces
the Portfolio Construction Rulebook (RB-12), and integrates with the Portfolio Registry.

## Authority & boundaries
It **constructs governed candidates deterministically**; it is **not** trade execution, order
management, or broker/market connectivity (those are the Execution Layer's). It holds **no execution
authority**. It contains **no** optimization algorithms or allocation mathematics — the deterministic,
net-of-cost optimizer plugs in behind the interface (DE-1/2). It **never re-adjudicates** whether a
signal is real (PS-1).

## What is here (Phase 2.8)
21 modules, each a subpackage with its own `README.md`:
`model` · `status` · `lifecycle` · `metadata` · `allocation` · `constraints` · `exposure` ·
`diversification` · `construction` · `optimization` · `rebalancing` · `validation_coordination` ·
`approval` · `reporting` · `registry_integration` · `management` · `policies` · `specifications` ·
`events` · `errors` · `repositories`.

- **Canonical models:** `Portfolio` (aggregate, reuses `core_domain.portfolio.Portfolio` semantics),
  `PortfolioIdentifier`, `PortfolioCandidate`, `PortfolioPosition`, `PortfolioAllocation`,
  `PortfolioConstraint`, `PortfolioExposure`, `PortfolioMetadata`, `PortfolioSummary`,
  `PortfolioDecision`, `PortfolioEvidence`, `PortfolioApproval`.
- **Lifecycle:** `PROPOSED → CONSTRUCTING → VALIDATING → REVIEWED → APPROVED → READY_FOR_EXECUTION →
  ARCHIVED` (+ `REJECTED`), supporting rebalancing, reconstruction, revalidation, versioning, and
  retirement; skips forbidden (fail-closed).
- **Domain events:** `PortfolioCreated`, `PortfolioConstructed`, `PortfolioValidated`,
  `PortfolioApproved`, `PortfolioRejected`, `PortfolioRebalanced`, `PortfolioArchived`,
  `PortfolioConstraintViolated`, `PortfolioRegistryUpdated`.

## Integration (by identity / foundation)
- **Signal Engine** — canonical source of investment signals (`PortfolioEvidence.signal_refs`, only
  capital-eligible; PS-1).
- **Risk Engine** — mandatory source of risk constraints (`PortfolioConstraint` from risk, RS-1).
- **Validation Foundation** — `validation_coordination` orchestrates validation.
- **Portfolio Registry** — `registry_integration` (immutable, versioned snapshots).

## Boundary rules (verified)
- **Deterministic, no algorithms/math:** the optimizer is a `...` interface stub; `PortfolioDecision`
  is deterministic; `DeterministicAllocationPolicy` + `AIAllocationDecision` error (PS-3, AI-1).
- **Eligible-only, net-of-cost, constraint-respecting:** `EligibleAlphaPolicy`/`IneligibleAlpha`
  (PS-1), `NetOfCostPolicy`/`GrossOptimization` (PS-2), `ConstraintViolation` (PS-2).
- **No execution / broker / market:** `NoExecutionAuthorityPolicy`/`ExecutionAuthorityAttempt`;
  a code scan confirms no broker/market/OMS imports.
- **Immutable snapshot + rationale + reproducible:** all models/records/events are `frozen`
  dataclasses (runtime `FrozenInstanceError`); every portfolio carries a rationale and provenance (PS-4);
  construction is reproducible (manifest-referenced); repositories append-only.
- **Compiles and imports cleanly**, 21 modules, no circular dependencies.

## Ownership
Accountable role: HPR (Head of Portfolio & Risk). Architecture owner: ARB.

## Dependencies
`core-domain`, `platform-validation`.

## Regeneration
Generated by [`tools/scaffolding/generate_portfolio_engine.sh`](../../tools/scaffolding/generate_portfolio_engine.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (PS-1..4, RS-1, AD-1, CP-2/5/7, AI-1, DE-1, RP-1, RL-1/2); Architecture V2 §5.6, §6.3;
Implementation Roadmap Phase 4; RB-12 · PORT; RB-13 · RISK; Portfolio Registry; `P1-08`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""portfolio_service — the deterministic Portfolio Engine.

Transforms approved investment signals into governed portfolio candidates, enforcing portfolio
construction principles, investment constraints, and institutional allocation policies. The
authoritative source of truth for portfolio composition.

Authority (PS-1..4, AI-1): it consumes only capital-eligible signals; it is net-of-cost and
constraint-respecting; NO LLM decides allocation/sizing; every portfolio is an immutable snapshot with
rationale. It reuses core_domain (portfolio context + shared kernel) and platform_validation,
references Signal/Risk by identity, enforces RB-12, and integrates with the Portfolio Registry.

Boundaries: NOT trade execution, NOT broker integration, NOT order management. No optimization
algorithms, no allocation mathematics, no persistence, no infrastructure, no API. The deterministic
optimizer plugs in behind the interface.

Modules: model, status, lifecycle, metadata, allocation, constraints, exposure, diversification,
construction, optimization, rebalancing, validation_coordination, approval, reporting,
registry_integration, management, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    allocation,
    approval,
    constraints,
    construction,
    diversification,
    errors,
    events,
    exposure,
    lifecycle,
    management,
    metadata,
    model,
    optimization,
    policies,
    rebalancing,
    registry_integration,
    reporting,
    repositories,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "metadata", "allocation", "constraints", "exposure",
    "diversification", "construction", "optimization", "rebalancing", "validation_coordination",
    "approval", "reporting", "registry_integration", "management", "policies", "specifications",
    "events", "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class PortfolioLifecycle(Enum):
    """The canonical portfolio lifecycle (plus REJECTED)."""

    PROPOSED = "proposed"
    CONSTRUCTING = "constructing"
    VALIDATING = "validating"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    READY_FOR_EXECUTION = "ready_for_execution"
    ARCHIVED = "archived"
    REJECTED = "rejected"


L = PortfolioLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[PortfolioLifecycle, PortfolioLifecycle], ...] = (
    (L.PROPOSED, L.CONSTRUCTING),
    (L.CONSTRUCTING, L.VALIDATING),
    (L.VALIDATING, L.REVIEWED),
    (L.REVIEWED, L.APPROVED),
    (L.APPROVED, L.READY_FOR_EXECUTION),
    (L.READY_FOR_EXECUTION, L.ARCHIVED),
    # reconstruction / rebalancing (produce a new version that re-validates)
    (L.CONSTRUCTING, L.PROPOSED),
    (L.READY_FOR_EXECUTION, L.CONSTRUCTING),
    # revalidation
    (L.READY_FOR_EXECUTION, L.VALIDATING),
    # rejection
    (L.VALIDATING, L.REJECTED),
    (L.REVIEWED, L.REJECTED),
    # retirement
    (L.APPROVED, L.ARCHIVED),
    (L.REJECTED, L.ARCHIVED),
)

#: Terminal state. Rebalancing/reconstruction/versioning produce a NEW versioned portfolio snapshot
#: (with lineage), never a mutation of an approved snapshot (RL-1, PS-4).
TERMINAL_STATES: frozenset[PortfolioLifecycle] = frozenset({L.ARCHIVED})


class PortfolioLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/READY_FOR_EXECUTION require validation + independent risk
    review; the service performs NO adjudication and no AI decides allocation (PS-3, AI-1). Interface only."""

    def transition(self, portfolio: EntityId, to: PortfolioLifecycle) -> None: ...
PY
pfreadme "$D" "lifecycle" \
"Define PortfolioLifecycle (PROPOSED/CONSTRUCTING/VALIDATING/REVIEWED/APPROVED/READY_FOR_EXECUTION/ARCHIVED + REJECTED), the canonical transitions (rebalancing/reconstruction/revalidation/versioning/retirement), and the lifecycle-service interface." \
"Enumerate the lifecycle and legal transitions as data; APPROVED/READY require validation + risk review; rebalancing/versioning create new lineage (RL-1, PS-4); hold no logic." \
"Consumed by model, status, construction, rebalancing, approval, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (PS-4, RS-1, RL-1/2, AI-1); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from portfolio_service.lifecycle import PortfolioLifecycle


@dataclass(frozen=True, slots=True)
class PortfolioStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: PortfolioLifecycle
    since: str
PY
pfreadme "$D" "status" \
"Define PortfolioStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent portfolio status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (PortfolioLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.6; RB-12 · PORT."

# ===========================================================================
# constraints
# ===========================================================================
D="$SRC/constraints"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Constraint Management — investment/risk constraint model and management INTERFACE (no math).

Constraints are deterministic and include the MANDATORY risk constraints sourced from the Risk Engine
(RS-1). Evaluation is done by the deterministic engine; no allocation mathematics here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class ConstraintKind(Enum):
    RISK = "risk"                      # mandatory, sourced from the Risk Engine (RS-1)
    EXPOSURE = "exposure"
    CONCENTRATION = "concentration"
    LEVERAGE = "leverage"
    LIQUIDITY = "liquidity"
    TURNOVER = "turnover"
    MANDATE = "mandate"


class ConstraintSeverity(Enum):
    SOFT = "soft"
    HARD = "hard"  # a hard-constraint breach blocks approval (PS-2)


@dataclass(frozen=True, slots=True)
class PortfolioConstraint:
    """A deterministic portfolio constraint.

    ``source`` references its origin (e.g. a Risk Engine assessment for RISK constraints, by identity).
    ``expression`` names the constraint (evaluated by the deterministic engine); no math here.
    """

    kind: ConstraintKind
    name: str
    expression: str
    severity: ConstraintSeverity
    source: Ref | None


class ConstraintManagementService(Protocol):
    """Manages (versioned) portfolio constraints, incl. mandatory risk constraints. Interface only."""

    def add_constraint(self, portfolio: EntityId, constraint: PortfolioConstraint) -> None: ...
PY
pfreadme "$D" "constraints" \
"Define PortfolioConstraint, ConstraintKind, ConstraintSeverity, and ConstraintManagementService: deterministic investment/risk constraints (incl. mandatory risk constraints) and their management." \
"Represent constraints as immutable data with a management interface; include mandatory risk constraints from the Risk Engine; hold no allocation mathematics." \
"Consumed by construction, diversification, exposure, specifications; risk constraints reference the Risk Engine by identity." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (PS-2, RS-1, DE-1); Architecture V2 §5.6, §5.7; RB-12 · PORT; RB-13 · RISK; P1-08."

# ===========================================================================
# allocation
# ===========================================================================
D="$SRC/allocation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Allocation Management — the position/allocation model and management INTERFACE (no math here).

Allocations reuse core_domain.portfolio.Weight/Allocation. Weights are produced by the deterministic
optimizer; this module holds NO allocation mathematics.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.portfolio import Weight
from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class PortfolioPosition:
    """A single position: an eligible signal/instrument and its target weight (net-of-cost, PS-2)."""

    signal_ref: Ref  # -> signal_service (capital-eligible signal, PS-1)
    weight: Weight


@dataclass(frozen=True, slots=True)
class PortfolioAllocation:
    """An immutable set of positions (the allocation of a portfolio candidate)."""

    positions: tuple[PortfolioPosition, ...]


class AllocationManagementService(Protocol):
    """Manages the allocation produced by the deterministic optimizer. Interface only — no math here.

    An LLM MUST NOT decide allocation/sizing (PS-3, AI-1); weights come from the deterministic optimizer.
    """

    def allocation_of(self, portfolio: EntityId) -> PortfolioAllocation: ...
PY
pfreadme "$D" "allocation" \
"Define PortfolioPosition, PortfolioAllocation, and AllocationManagementService: the allocation model and its management (reusing core Weight)." \
"Represent positions/allocations as immutable data produced by the deterministic optimizer; reference only eligible signals; hold no allocation mathematics and no AI decision." \
"Consumed by construction, exposure, reporting; positions reference eligible signals by identity." \
"core_domain.portfolio (Weight); core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (PS-1/2/3, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; P1-08."

# ===========================================================================
# exposure
# ===========================================================================
D="$SRC/exposure"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Exposure Management — the exposure model and governance INTERFACE (no computation here).

Exposure values are MEASURED by the deterministic engine and referenced here; this module governs
exposures against constraints. No allocation/exposure mathematics.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class PortfolioExposure:
    """A measured portfolio exposure governed against a constraint (value supplied by the engine)."""

    measure: str
    value: float
    constraint_name: str


class ExposureManagementService(Protocol):
    """Governs measured exposures against deterministic constraints. Interface only — no computation."""

    def exposures_of(self, portfolio: EntityId) -> tuple[PortfolioExposure, ...]: ...
PY
pfreadme "$D" "exposure" \
"Define PortfolioExposure and ExposureManagementService: measured exposures governed against constraints." \
"Govern exposures against constraints; reference measured values (computed by the deterministic engine); hold no computation." \
"Consumed by diversification, reporting, specifications." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (PS-2, RS-1, DE-1); Architecture V2 §5.6; RB-12 · PORT; RB-13 · RISK."

# ===========================================================================
# diversification
# ===========================================================================
D="$SRC/diversification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Diversification Governance — the diversification governance INTERFACE (no computation here).

Governs concentration/diversification against constraints deterministically; the numerical measures
are supplied by the deterministic engine. No allocation mathematics.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class DiversificationGovernanceService(Protocol):
    """Governs a portfolio's diversification/concentration against constraints. Interface only.

    It references measured concentration values and evaluates them against constraints deterministically;
    it computes no diversification mathematics. A hard breach blocks approval (PS-2).
    """

    def is_within_diversification_limits(self, portfolio: EntityId) -> bool: ...
PY
pfreadme "$D" "diversification" \
"Define DiversificationGovernanceService: govern a portfolio's diversification/concentration against constraints." \
"Govern diversification deterministically against constraints; reference measured values; compute no mathematics; hold no logic." \
"core_domain.shared (EntityId); consumes constraints/exposures; consumed by construction/specifications." \
"CLAUDE.md (PS-2, DE-1); Architecture V2 §5.6; RB-12 · PORT." \
"CLAUDE.md (PS-2, DE-1); Architecture V2 §5.6; RB-12 · PORT."

# ===========================================================================
# optimization
# ===========================================================================
D="$SRC/optimization"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Optimization Interface — the deterministic optimizer contract (no algorithm here).

The concrete optimizer is deterministic, net-of-cost, and constraint-respecting (PS-2), versioned and
golden-tested (DE-1/2). NO optimization algorithm or allocation mathematics here. Reuses
core_domain.portfolio.PortfolioOptimizer / OptimizationConstraints.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.portfolio import OptimizationConstraints, PortfolioOptimizer  # reuse
from core_domain.shared import EntityId

from portfolio_service.allocation import PortfolioAllocation


class PortfolioOptimizationInterface(Protocol):
    """The deterministic, net-of-cost portfolio optimizer interface. Interface only.

    It produces an allocation from eligible signals subject to constraints; an LLM MUST NOT decide
    allocation/sizing (PS-3, AI-1); it optimizes net-of-cost, never gross (PS-2).
    """

    def optimize(self, portfolio: EntityId, constraints: OptimizationConstraints) -> PortfolioAllocation: ...


__all__ = ["OptimizationConstraints", "PortfolioOptimizer", "PortfolioOptimizationInterface"]
PY
pfreadme "$D" "optimization" \
"Define PortfolioOptimizationInterface and re-export the deterministic PortfolioOptimizer / OptimizationConstraints (from core_domain.portfolio)." \
"Express deterministic, net-of-cost, constraint-respecting optimization as an interface; hold no optimization algorithm or allocation mathematics; no AI decides allocation." \
"Consumed by construction; the concrete optimizer plugs in behind this interface (golden-tested)." \
"core_domain.portfolio (PortfolioOptimizer, OptimizationConstraints); core_domain.shared (EntityId); allocation." \
"CLAUDE.md (PS-2/3, AI-1, DE-1/2); Architecture V2 §5.6, §6.3; RB-12 · PORT; P1-08."

# ===========================================================================
# construction
# ===========================================================================
D="$SRC/construction"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Construction — the construction context and coordination INTERFACE (no math here).

Coordinates deterministic construction of a portfolio candidate from eligible signals subject to
constraints, via the deterministic optimizer. It is reproducible (manifest-referenced, RP-1). No
optimization algorithm or allocation mathematics here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref, RunManifestRef


@dataclass(frozen=True, slots=True)
class PortfolioConstructionContext:
    """Immutable context for a construction run (reproducibility spine, RP-1).

    ``eligible_signal_refs`` are capital-eligible signals only (PS-1); ``manifest`` binds the run for
    reproducibility; ``as_of`` is a supplied point-in-time boundary for any historical reads (PIT-1).
    """

    eligible_signal_refs: tuple[Ref, ...]
    manifest: RunManifestRef
    as_of: str | None


class PortfolioConstructionService(Protocol):
    """Coordinates deterministic construction of a portfolio candidate. Interface only.

    It consumes only capital-eligible signals (PS-1) and delegates to the deterministic optimizer; it
    never re-adjudicates whether a signal is real and never decides allocation with AI (PS-1, PS-3).
    """

    def construct(self, portfolio: EntityId, context: PortfolioConstructionContext) -> None: ...
PY
pfreadme "$D" "construction" \
"Define PortfolioConstructionContext and PortfolioConstructionService: the reproducible construction context and coordination interface." \
"Coordinate deterministic construction from capital-eligible signals via the optimizer; be reproducible (manifest); never re-adjudicate signals or decide allocation with AI; hold no mathematics." \
"core_domain.shared (EntityId, Ref, RunManifestRef); consumes eligible signals; delegates to optimization." \
"Consumed by management; precedes validation." \
"CLAUDE.md (PS-1/2/3, RP-1, PIT-1, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; P1-08."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Model — the canonical portfolio aggregate, candidate, and value objects (data only).

A portfolio is an immutable, content-addressed snapshot with rationale (PS-4). It references its
constituent eligible signals and risk approval by identity; it holds no optimization algorithm.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.portfolio import PortfolioRationale
from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Ref, Version

from portfolio_service.allocation import PortfolioAllocation
from portfolio_service.status import PortfolioStatus


class DecisionVerdict(Enum):
    CONSTRUCT = "construct"
    REJECT = "reject"


@dataclass(frozen=True, slots=True)
class PortfolioIdentifier:
    """A stable, versioned identity for a portfolio (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class PortfolioEvidence:
    """Traceable evidence references (by identity, not computed).

    ``signal_refs`` are capital-eligible signals (PS-1); ``risk_ref`` is the mandatory risk source (RS-1).
    """

    signal_refs: tuple[Ref, ...]
    risk_ref: Ref


@dataclass(frozen=True, slots=True)
class PortfolioDecision:
    """A deterministic decision with an explainable rationale (EXP-2). No AI decides (AI-1)."""

    verdict: DecisionVerdict
    rationale: str


@dataclass(frozen=True, slots=True)
class PortfolioSummary:
    """A compact, immutable summary of a portfolio (references, not computed statistics)."""

    position_count: int
    gross_exposure_ref: str
    net_exposure_ref: str


@dataclass(frozen=True, slots=True)
class PortfolioCandidate:
    """A governed portfolio candidate: the allocation proposed for validation/review (immutable)."""

    identifier: PortfolioIdentifier
    allocation: PortfolioAllocation
    evidence: PortfolioEvidence
    rationale: PortfolioRationale


@dataclass(eq=False)
class Portfolio(AggregateRoot):
    """A portfolio (aggregate root): an immutable, content-addressed snapshot with rationale (PS-4).

    Constructed deterministically from capital-eligible signals within risk constraints (PS-1/2). It
    is NOT execution; it holds no optimization algorithm.
    """

    identifier: PortfolioIdentifier
    snapshot: ContentAddress
    allocation: PortfolioAllocation
    evidence: PortfolioEvidence
    rationale: PortfolioRationale
    status: PortfolioStatus
    provenance: Provenance
PY
pfreadme "$D" "model" \
"Define the canonical portfolio models: Portfolio (aggregate), PortfolioCandidate, PortfolioIdentifier, PortfolioEvidence, PortfolioSummary, PortfolioDecision (reusing core PortfolioRationale)." \
"Represent a portfolio as an immutable, content-addressed snapshot with rationale that references eligible signals and risk by identity; hold no optimization algorithm, no execution, no AI decision." \
"Consumed by every Portfolio Engine module; references Signal/Risk by identity; reuses core_domain.portfolio." \
"core_domain.portfolio (PortfolioRationale); core_domain.shared (AggregateRoot, ContentAddress, Provenance, Ref, Version); allocation; status." \
"CLAUDE.md (PS-1..4, CP-2/5/7, AI-1, NM-2); Architecture V2 §5.6, §6.3; RB-12 · PORT; Portfolio Registry; P1-08."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Metadata — the immutable, auditable metadata of a portfolio (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from portfolio_service.model import PortfolioIdentifier, PortfolioSummary
from portfolio_service.status import PortfolioStatus


@dataclass(frozen=True, slots=True)
class PortfolioMetadata:
    """Immutable metadata for a portfolio (auditable, provenance-bearing)."""

    identifier: PortfolioIdentifier
    description: str
    owner_role: str
    status: PortfolioStatus
    summary: PortfolioSummary
    provenance: Provenance
    tags: tuple[str, ...]
PY
pfreadme "$D" "metadata" \
"Define PortfolioMetadata: the immutable, auditable, provenance-bearing metadata of a portfolio." \
"Carry portfolio metadata (identity, description, owner, status, summary, provenance, tags) as data; hold no logic." \
"Consumed by management and repositories." \
"core_domain.shared (Provenance); model; status." \
"CLAUDE.md (CP-7, PS-4); Architecture V2 §5.6; RB-12 · PORT."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Validation — orchestrates validation of a portfolio via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the portfolio to the deterministic
Validation/Risk engines. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class PortfolioValidationCoordinator(Protocol):
    """Coordinates a portfolio's validation before REVIEWED/APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; constraint/risk validation is
    the deterministic engines'; independent risk review is required before approval (RS-1/2).
    """

    def request_validation(self, portfolio: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, portfolio: EntityId) -> ValidationReport: ...
PY
pfreadme "$D" "validation_coordination" \
"Define PortfolioValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation/Risk engines." \
"Coordinate validation; defer constraint/risk validation to the deterministic engines; require independent risk review; assert no significance; hold no logic." \
"core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to REVIEWED/APPROVED." \
"CLAUDE.md (AI-2, DE-1, RS-1/2, VS-1); Architecture V2 §5.6, §5.7, §6.3; RB-04 · VAL; RB-12 · PORT; RB-13 · RISK."

# ===========================================================================
# rebalancing
# ===========================================================================
D="$SRC/rebalancing"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Rebalancing Coordination — coordinates governed rebalancing/reconstruction (no math here).

A rebalance produces a NEW versioned portfolio candidate that re-enters validation; it never mutates
an approved snapshot (RL-1, PS-4). No allocation mathematics here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RebalancingCoordinator(Protocol):
    """Coordinates governed rebalancing/reconstruction of a portfolio. Interface only.

    It produces a new versioned candidate (turnover-aware, net-of-cost) that re-validates; it computes
    no allocation mathematics and never edits an approved snapshot.
    """

    def request_rebalance(self, portfolio: EntityId) -> EntityId: ...
PY
pfreadme "$D" "rebalancing" \
"Define RebalancingCoordinator: coordinate governed rebalancing/reconstruction producing a new versioned candidate." \
"Coordinate rebalancing that re-validates and preserves the approved snapshot (RL-1); net-of-cost, turnover-aware; hold no mathematics." \
"core_domain.shared (EntityId); produces a new candidate via construction/optimization." \
"Consumed by management." \
"CLAUDE.md (PS-2/4, RL-1, RP-1); Architecture V2 §5.6; RB-12 · PORT; P1-08."

# ===========================================================================
# approval
# ===========================================================================
D="$SRC/approval"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Approval — approval model + INTERFACE (independent risk review; human sign-off)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class PortfolioApproval:
    """Records that a portfolio cleared validation and independent risk review (RS-2).

    Capital-affecting approval requires human sign-off and counter-sign (HO-2); no AI approves (AI-3).
    """

    validated: bool
    risk_review_ref: Ref
    approver_role: str
    counter_signed: bool


class PortfolioApprovalService(Protocol):
    """Approves a portfolio for READY_FOR_EXECUTION after validation + independent risk review. Interface only."""

    def approve(self, portfolio: EntityId) -> None: ...
    def reject(self, portfolio: EntityId, reason: str) -> None: ...
PY
pfreadme "$D" "approval" \
"Define PortfolioApproval and PortfolioApprovalService: approval requiring validation, independent risk review, and human counter-sign." \
"Record approval only when validated and independently risk-reviewed; require human counter-sign for capital; no AI approves; hold no logic." \
"core_domain.shared (EntityId, Ref); requires independent risk review from the Risk Engine." \
"Consumed by lifecycle/management; gates READY_FOR_EXECUTION." \
"CLAUDE.md (RS-2, HO-2, AI-3, PS-1); Architecture V2 §5.6, §5.7, §6.2; RB-12 · PORT; RB-13 · RISK."

# ===========================================================================
# reporting
# ===========================================================================
D="$SRC/reporting"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Reporting — the portfolio report model and reporting INTERFACE (references, not math).

Attribution/exposure metrics are computed by deterministic engines and referenced here; this module
computes no statistics or mathematics.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.exposure import PortfolioExposure
from portfolio_service.model import PortfolioSummary


@dataclass(frozen=True, slots=True)
class PortfolioReport:
    """An immutable, explainable portfolio report (references deterministic outputs, EXP-2)."""

    portfolio_id: EntityId
    summary: PortfolioSummary
    exposures: tuple[PortfolioExposure, ...]
    breaches: tuple[str, ...]


class PortfolioReportingService(Protocol):
    """Generates an immutable, explainable portfolio report. Interface only — no computation."""

    def generate(self, portfolio: EntityId) -> PortfolioReport: ...
PY
pfreadme "$D" "reporting" \
"Define PortfolioReport and PortfolioReportingService: the immutable, explainable portfolio report and its generation." \
"Aggregate the summary, measured exposures, and breaches into an explainable report; compute no statistics/mathematics; hold no logic." \
"core_domain.shared (EntityId); model (PortfolioSummary); exposure (PortfolioExposure)." \
"Consumed by review/management/governance." \
"CLAUDE.md (EXP-2, CP-7, PS-4); Architecture V2 §5.6; RB-12 · PORT."

# ===========================================================================
# registry_integration
# ===========================================================================
D="$SRC/registry_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Registry Integration — the port to the Portfolio Registry (immutable snapshots; no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.model import Portfolio


class PortfolioRegistryPort(Protocol):
    """The port to the Portfolio Registry. Interface only — the concrete registry stores elsewhere.

    Every portfolio is an immutable, content-addressed snapshot with rationale (PS-4); a change creates
    a new version. Registration is append-only.
    """

    def register(self, portfolio: Portfolio) -> None: ...
    def get(self, portfolio: EntityId) -> Portfolio: ...
PY
pfreadme "$D" "registry_integration" \
"Define PortfolioRegistryPort: the integration port to the Portfolio Registry." \
"Integrate immutable, versioned, rationale-bearing snapshot registration as an interface; hold no persistence." \
"Consumed by management; delegates to core_domain.portfolio repositories and the Portfolio Registry." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (PS-4, CP-2/7); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Management — the Portfolio Engine application/service INTERFACES (deterministic; no execution).

Orchestrates the portfolio lifecycle and gates approval on validation + independent risk review. It is
deterministic, net-of-cost, and holds NO execution authority. No AI decides allocation (PS-3, AI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.metadata import PortfolioMetadata
from portfolio_service.model import PortfolioDecision


class PortfolioService(Protocol):
    """The Portfolio Engine service (interface only): drive the portfolio lifecycle."""

    def propose(self, subject: EntityId) -> EntityId: ...
    def construct(self, portfolio: EntityId) -> None: ...
    def submit_for_validation(self, portfolio: EntityId) -> None: ...
    def approve(self, portfolio: EntityId) -> None: ...
    def mark_ready_for_execution(self, portfolio: EntityId) -> None: ...
    def rebalance(self, portfolio: EntityId) -> EntityId: ...
    def archive(self, portfolio: EntityId) -> None: ...


class PortfolioEngineService(Protocol):
    """The deterministic portfolio decision gate: yields a PortfolioDecision. Interface only."""

    def decide(self, subject: EntityId) -> PortfolioDecision: ...


class PortfolioCatalogService(Protocol):
    """Describes portfolios from the catalog/registry. Interface only."""

    def describe(self, portfolio: EntityId) -> PortfolioMetadata: ...
PY
pfreadme "$D" "management" \
"Define the Portfolio Engine service interfaces: PortfolioService (lifecycle), PortfolioEngineService (deterministic decision gate), PortfolioCatalogService." \
"Orchestrate the portfolio lifecycle and gate approval on validation + independent risk review; deterministic and net-of-cost; hold no execution authority and no AI allocation decision." \
"Top-level module: composes model, construction, optimization, allocation/constraints/exposure/diversification, validation/approval, registry." \
"core_domain.shared (EntityId); model; metadata." \
"CLAUDE.md (PS-1..4, RS-1/2, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; RB-13 · RISK; Portfolio Registry."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Policies — allocation/constraint governance policy INTERFACES (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class PortfolioPolicy(Protocol):
    """Marker for a deterministic, versioned portfolio policy."""

    ...


class AllocationPolicy(Protocol):
    """Governs how allocation is produced: net-of-cost, deterministic, no AI sizing (PS-2/3). Interface only."""

    def is_net_of_cost(self, portfolio: EntityId) -> bool: ...
    def is_deterministic(self, portfolio: EntityId) -> bool: ...


class ConstraintPolicy(Protocol):
    """Governs mandatory constraint enforcement (incl. risk constraints); hard breaches block (PS-2, RS-1). Interface only."""

    def constraints_respected(self, portfolio: EntityId) -> bool: ...


class EligibleAlphaPolicy(Protocol):
    """Only capital-eligible signals may be constituents; never re-adjudicate (PS-1). Interface only."""

    def all_constituents_eligible(self, portfolio: EntityId) -> bool: ...


class DeterministicAllocationPolicy(Protocol):
    """Allocation/sizing is deterministic; an LLM MUST NOT decide it (PS-3, AI-1). Interface only."""

    def is_engine_decided(self, portfolio: EntityId) -> bool: ...


class NoExecutionAuthorityPolicy(Protocol):
    """The Portfolio Engine constructs but NEVER executes (boundary). Interface only."""

    def has_no_execution_authority(self, portfolio: EntityId) -> bool: ...
PY
pfreadme "$D" "policies" \
"Define the deterministic portfolio policy interfaces: PortfolioPolicy, AllocationPolicy, ConstraintPolicy, EligibleAlphaPolicy, DeterministicAllocationPolicy, NoExecutionAuthorityPolicy." \
"Express the portfolio-construction rules (net-of-cost, constraint-respecting, eligible-only, deterministic allocation, no execution) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by construction/management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (PS-1..4, RS-1, AI-1, DE-1); Architecture V2 §5.6, §6.3; RB-12 · PORT; RB-13 · RISK; P1-08."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Specifications — composable STRUCTURAL predicates over portfolios (no mathematics).

These check structural readiness/governance prerequisites (eligible constituents, constraints declared,
rationale present), NOT numerical exposures/weights — those are the deterministic engines' outputs.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TPortfolio = TypeVar("TPortfolio", contravariant=True)


class PortfolioSpecification(Protocol[TPortfolio]):
    """A composable, deterministic structural predicate over a portfolio. Interface only."""

    def is_satisfied_by(self, portfolio: TPortfolio) -> bool: ...


class ReadyForApprovalSpecification(Protocol[TPortfolio]):
    """Structural readiness for approval (constructed, validated, constraints respected, rationale present).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, portfolio: TPortfolio) -> bool: ...


class EligibleConstituentsSpecification(Protocol[TPortfolio]):
    """Structural check that all constituents are capital-eligible signals (PS-1). Interface only."""

    def is_satisfied_by(self, portfolio: TPortfolio) -> bool: ...
PY
pfreadme "$D" "specifications" \
"Define composable STRUCTURAL portfolio specifications: PortfolioSpecification, ReadyForApprovalSpecification, EligibleConstituentsSpecification." \
"Express reusable, composable structural readiness/eligibility predicates; never compute exposures/weights or decide; hold no logic." \
"Composed by management/construction; numerical outputs are the deterministic engines'." \
"Standard library only." \
"CLAUDE.md (DE-1, PS-1/2, SE-3); Architecture V2 §5.6, §6.3; RB-12 · PORT."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Domain Events — immutable facts about a portfolio (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class PortfolioCreated(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioConstructed(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided)."""

    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioApproved(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioRejected(DomainEvent):
    portfolio_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class PortfolioRebalanced(DomainEvent):
    portfolio_id: EntityId
    new_version_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioArchived(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioConstraintViolated(DomainEvent):
    portfolio_id: EntityId
    constraint: str


@dataclass(frozen=True, slots=True)
class PortfolioRegistryUpdated(DomainEvent):
    portfolio_id: EntityId
PY
pfreadme "$D" "events" \
"Define the canonical portfolio domain events: PortfolioCreated, PortfolioConstructed, PortfolioValidated, PortfolioApproved, PortfolioRejected, PortfolioRebalanced, PortfolioArchived, PortfolioConstraintViolated, PortfolioRegistryUpdated." \
"Represent portfolio lifecycle facts as immutable domain events; PortfolioValidated records a deterministic-engine outcome." \
"core_domain.shared (DomainEvent, EntityId); align with core_domain.portfolio events." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, PS-4); Architecture V2 §5.6, §5.10; RB-12 · PORT; Portfolio Registry."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Errors — Portfolio Engine domain errors (each expresses a violated portfolio invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class PortfolioError(DomainError):
    """Base for Portfolio Engine errors."""


class IneligibleAlpha(PortfolioError):
    """Construction consumed a signal lacking a valid capital-eligibility token (PS-1)."""


class GrossOptimization(PortfolioError):
    """Optimization used gross (pre-cost) returns (PS-2)."""


class ConstraintViolation(PortfolioError):
    """A portfolio violates a hard risk/investment constraint (PS-2, RS-1)."""


class AIAllocationDecision(PortfolioError):
    """An LLM/AI attempted to decide allocation or sizing (PS-3, AI-1)."""


class SignalReadjudication(PortfolioError):
    """The Portfolio Engine attempted to re-adjudicate whether a signal is real (PS-1)."""


class ExecutionAuthorityAttempt(PortfolioError):
    """The Portfolio Engine attempted execution or to authorize execution (out of scope, boundary)."""


class ImmutableSnapshotMutation(PortfolioError):
    """An attempt to mutate an approved, immutable portfolio snapshot (PS-4, CP-2)."""


class IllegalPortfolioTransition(PortfolioError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
PY
pfreadme "$D" "errors" \
"Define the Portfolio Engine errors: IneligibleAlpha, GrossOptimization, ConstraintViolation, AIAllocationDecision, SignalReadjudication, ExecutionAuthorityAttempt, ImmutableSnapshotMutation, IllegalPortfolioTransition." \
"Express violated portfolio invariants (eligible-only, net-of-cost, constraint-respecting, deterministic allocation, no re-adjudication, no execution, snapshot immutability, lifecycle) as errors." \
"Used across the Portfolio Engine modules." \
"core_domain.shared (DomainError); aligns with core_domain.portfolio errors." \
"CLAUDE.md (PS-1..4, RS-1, AI-1, CP-2); Architecture V2 §5.6, §6.3; RB-12 · PORT; RB-13 · RISK; P1-08."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Portfolio Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.model import Portfolio, PortfolioCandidate


class PortfolioRepositoryContract(Protocol):
    """Append-only repository of immutable portfolio snapshots (supersede, never mutate, PS-4, CP-2)."""

    def get(self, portfolio: EntityId) -> Portfolio: ...
    def add(self, portfolio: Portfolio) -> None: ...


class PortfolioCandidateRepository(Protocol):
    """Append-only repository of portfolio candidates. Interface only."""

    def get(self, candidate: EntityId) -> PortfolioCandidate: ...
    def add(self, candidate: PortfolioCandidate) -> None: ...
PY
pfreadme "$D" "repositories" \
"Define the Portfolio Engine repository interfaces: PortfolioRepositoryContract (append-only snapshots), PortfolioCandidateRepository." \
"Express append-only, immutable retrieval of portfolio snapshots and candidates as interfaces; hold no persistence." \
"Consumed by management; complements core_domain.portfolio repositories and the Portfolio Registry." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (PS-4, CP-2, RL-2); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry."

echo "Portfolio Engine generated."
