#!/usr/bin/env bash
#
# generate_backtesting_engine.sh — Phase 2.5 Backtesting Engine generator.
#
# Governed by: CLAUDE.md (BT-1..4, PIT-1..4, CP-2/4/5/7, DE-1/2, RP-1/2, SI-3, AD-1, AI-2, EX-2);
#              Architecture V2 §5.6 (Quantitative Engine Layer — deterministic core), §6.3; Implementation
#              Roadmap Phase 4 (deterministic core); RB-11 · BT, RB-01 · STAT, RB-04 · VAL; P3-16, P1-02.
#
# Emits the Backtesting Engine under services/backtesting-service as `backtesting_service`: the
# backtest aggregate + session, scenario, configuration, execution context, historical-simulation
# coordination, validation coordination, performance reporting, result management, scenario comparison,
# reproducibility management, engine/runner interfaces, lifecycle, policies, specifications, domain
# events, errors, and repositories. It reuses core_domain.shared (reproducibility spine) and the
# Validation Foundation; it references Experiment/Feature by identity (SE-2).
#
# It is a DETERMINISTIC, REPRODUCIBLE research-execution engine. It is NOT production execution, NOT
# live trading, NOT portfolio optimization. It contains NO simulation algorithms, NO statistical
# calculations, NO broker/market connectivity, NO persistence, NO infrastructure, NO API. Time is
# SIMULATED via the injected clock (PIT-4, BT-1); every run is reproducible from its Run Manifest
# (P1-02); results are immutable and never manually edited (BT-3/4). Idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/backtesting-service"
SRC="$SVC/src/backtesting_service"
cd "$ROOT"

btreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# backtesting-service · $2

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

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
# backtesting-service — the deterministic Backtesting Engine (Phase 2.5).
# Standard library + Phase-1/2 foundations only. No simulation/statistics/persistence/broker/API deps.
[project]
name = "backtesting-service"
version = "0.1.0"
description = "Backtesting Engine: deterministic, reproducible historical simulation model & interfaces."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/backtesting_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# backtesting-service — Backtesting Engine implemented in Phase 2.5

This service contains the Backtesting Engine (the `backtesting_service` package): the backtest
aggregate, session, scenario, configuration, execution context, historical-simulation coordination,
validation coordination, performance reporting, result management, scenario comparison, reproducibility
management, engine/runner interfaces, lifecycle, policies, specifications, domain events, errors, and
repositories. Simulation algorithms, statistical calculations, production execution, broker/market
connectivity, persistence, infrastructure, and APIs remain forbidden here. Significance is the
deterministic Statistics/Validation engines' domain; execution is the Execution Layer's.
MD

cat > "$SVC/README.md" <<'MD'
# Backtesting Service — the Backtesting Engine (`backtesting_service`)

> **Phase 2.5 — Backtesting Engine (implemented).** The deterministic research-execution engine that
> evaluates quantitative strategies under controlled historical conditions and transforms validated
> research artifacts into **reproducible performance evidence**. The institutional source of truth
> for historical simulation. **Canonical module, interfaces only** — no simulation algorithms, no
> statistical calculations, no production execution, no broker/market connectivity, no persistence,
> no infrastructure, no API.

## Purpose
Realize the Backtest Engine of the **Quantitative Engine Layer** (Architecture V2 §5.6, the
deterministic core). The **same engine** runs backtest/paper/live differing only by injected clock
and adapter (AV2-23); here only the backtest abstraction is defined. Time is **simulated** via the
injected clock (PIT-4, BT-1); every run is **reproducible** from its Run Manifest (P1-02, RP-1);
results are **immutable** and never manually edited (BT-3/4). It reuses the Phase-1/2 foundations.

## Authority & boundaries
The Backtesting Engine produces **evidence**, it does **not adjudicate**: statistical significance,
deflation, PBO, holdout, and replication are the deterministic **Statistics/Validation** engines'
domain (SI-3, AI-2, `P2-*`); execution/deployment is the **Execution Layer's**. It is **not**
production execution, has **no** broker/market connectivity, and holds **no** simulation algorithm
or statistics — those plug in behind these interfaces as versioned, golden-tested, reproducible
deterministic engines (DE-1/2).

## What is here (Phase 2.5)
20 modules, each a subpackage with its own `README.md`:
`model` · `status` · `lifecycle` · `configuration` · `scenario` · `context` · `metadata` · `session`
· `simulation_coordination` · `validation_coordination` · `performance_reporting` ·
`result_management` · `scenario_comparison` · `reproducibility` · `engine` · `policies` ·
`specifications` · `events` · `errors` · `repositories`.

- **Canonical models:** `Backtest` (aggregate, reuses `core_domain.AggregateRoot` + `RunManifestRef`),
  `BacktestIdentifier`, `BacktestConfiguration`, `BacktestScenario`, `BacktestContext` (simulated
  clock), `BacktestMetadata`, `BacktestResult`, `PerformanceReport`, `ExecutionSummary`,
  `ScenarioComparison`, `BacktestEvidence`.
- **Lifecycle:** `PROPOSED → CONFIGURED → READY → RUNNING → VALIDATING → COMPLETED → APPROVED →
  ARCHIVED` (+ `SUSPENDED`, `CANCELLED`), supporting replay (new lineage, RL-1), resume, cancellation,
  comparison, and revalidation; skips forbidden (fail-closed).
- **Domain events:** `BacktestCreated`, `BacktestConfigured`, `BacktestStarted`, `BacktestCompleted`,
  `BacktestValidated`, `BacktestApproved`, `BacktestArchived`, `ScenarioCompared`,
  `PerformanceReportGenerated`.

## Integration (by identity / foundation)
- **Experiment Service** — the canonical experiment source (referenced by identity).
- **Feature Service** — the canonical feature source (referenced by identity in configuration).
- **Validation Foundation** (`platform_validation`) — `validation_coordination` orchestrates validation;
  the deterministic Validation engine decides.

## Boundary rules (verified)
- **Deterministic & reproducible:** `BacktestContext` carries the simulated clock (`as_of`) and a
  seed reference; every `Backtest`/result binds a `RunManifestRef`; a code scan confirms **no**
  simulation/statistics libraries, no wall-clock, no `def simulate`/`def calculate`.
- **No production execution / broker / market:** encoded as `NoProductionExecutionPolicy` +
  `ProductionExecutionAttempt` error; the engine has no connectivity imports.
- **Immutable & non-editable results:** all models/records/events are `frozen` dataclasses (runtime
  `FrozenInstanceError`); `NoManualEditPolicy` + `ManualResultEdit` error (BT-4); results carry
  attribution + capacity references (BT-3).
- **Institutional realism by reference:** net-of-cost, borrow, participation-aware impact, capacity
  are declared as references/policies (BT-2, P3-16) — the deterministic engine applies them.
- **Compiles and imports cleanly**, 20 modules, no circular dependencies.

## Ownership
Accountable role: HQ (Head of Quantitative Research). Architecture owner: ARB.

## Dependencies
`core-domain`, `platform-validation`.

## Regeneration
Generated by [`tools/scaffolding/generate_backtesting_engine.sh`](../../tools/scaffolding/generate_backtesting_engine.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (BT-1..4, PIT-1..4, CP-2/4/5/7, DE-1/2, RP-1/2, SI-3, AD-1, AI-2, EX-2); Architecture V2 §5.6,
§6.3; Implementation Roadmap Phase 4 (deterministic core); RB-11 · BT; RB-01 · STAT; RB-04 · VAL;
`P3-16`, `P1-02`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""backtesting_service — the deterministic Backtesting Engine.

Evaluates quantitative strategies under controlled historical conditions and transforms validated
research artifacts into reproducible performance evidence. The same engine runs backtest/paper/live
differing only by injected clock and adapter (AV2-23); here only the backtest abstraction is defined.

Determinism & reproducibility: time is SIMULATED via the injected clock (PIT-4, BT-1); every run is
reproducible from its Run Manifest (P1-02, RP-1/2, EX-2); results are immutable and never manually
edited (BT-3/4). It reuses core_domain.shared (reproducibility spine) and platform_validation, and
references Experiment/Feature by identity.

Boundaries: NOT production execution, NOT live trading, NOT portfolio optimization. No simulation
algorithms, no statistical calculations, no broker/market connectivity, no persistence, no
infrastructure, no API. Significance is the deterministic Statistics/Validation engines' domain (AI-2,
SI-3); it produces evidence, it never adjudicates.

Modules: model, status, lifecycle, configuration, scenario, context, metadata, session,
simulation_coordination, validation_coordination, performance_reporting, result_management,
scenario_comparison, reproducibility, engine, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    configuration,
    context,
    engine,
    errors,
    events,
    lifecycle,
    metadata,
    model,
    performance_reporting,
    policies,
    reproducibility,
    repositories,
    result_management,
    scenario,
    scenario_comparison,
    session,
    simulation_coordination,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "configuration", "scenario", "context", "metadata", "session",
    "simulation_coordination", "validation_coordination", "performance_reporting",
    "result_management", "scenario_comparison", "reproducibility", "engine", "policies",
    "specifications", "events", "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class BacktestLifecycle(Enum):
    """The canonical backtest lifecycle (plus SUSPENDED for resume and CANCELLED for cancellation)."""

    PROPOSED = "proposed"
    CONFIGURED = "configured"
    READY = "ready"
    RUNNING = "running"
    VALIDATING = "validating"
    COMPLETED = "completed"
    APPROVED = "approved"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


L = BacktestLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[BacktestLifecycle, BacktestLifecycle], ...] = (
    (L.PROPOSED, L.CONFIGURED),
    (L.CONFIGURED, L.READY),
    (L.READY, L.RUNNING),
    (L.RUNNING, L.VALIDATING),
    (L.VALIDATING, L.COMPLETED),
    (L.COMPLETED, L.APPROVED),
    (L.APPROVED, L.ARCHIVED),
    # revision (before running)
    (L.CONFIGURED, L.PROPOSED),
    (L.READY, L.CONFIGURED),
    # resume
    (L.RUNNING, L.SUSPENDED),
    (L.VALIDATING, L.SUSPENDED),
    (L.SUSPENDED, L.RUNNING),
    # revalidation (of an immutable completed result)
    (L.COMPLETED, L.VALIDATING),
    # cancellation
    (L.CONFIGURED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.RUNNING, L.CANCELLED),
    (L.VALIDATING, L.CANCELLED),
    (L.SUSPENDED, L.CANCELLED),
)

#: Terminal states. Replay reproduces a run from its manifest as a NEW backtest (with lineage), never
#: a mutation of a completed run (RL-1, BT-3); comparison is an operation, not a state.
TERMINAL_STATES: frozenset[BacktestLifecycle] = frozenset({L.ARCHIVED, L.CANCELLED})


class BacktestLifecycleService(Protocol):
    """Governs lifecycle transitions. VALIDATING/COMPLETED/APPROVED require the deterministic run and
    validation gates; the service performs NO adjudication. Interface only."""

    def transition(self, backtest: EntityId, to: BacktestLifecycle) -> None: ...
PY
btreadme "$D" "lifecycle" \
"Define BacktestLifecycle (PROPOSED/CONFIGURED/READY/RUNNING/VALIDATING/COMPLETED/APPROVED/ARCHIVED + SUSPENDED/CANCELLED), the canonical transitions (revision/resume/revalidation/cancellation), and the lifecycle-service interface." \
"Enumerate the lifecycle and legal transitions as data; replay reproduces a run as new lineage (RL-1); hold no logic." \
"Consumed by model, status, engine, session, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RL-1, BT-3, CP-5); Architecture V2 §5.6; RB-11 · BT."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from backtesting_service.lifecycle import BacktestLifecycle


@dataclass(frozen=True, slots=True)
class BacktestStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: BacktestLifecycle
    since: str
PY
btreadme "$D" "status" \
"Define BacktestStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent backtest status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (BacktestLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.6; RB-11 · BT."

# ===========================================================================
# configuration
# ===========================================================================
D="$SRC/configuration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Configuration — the immutable, reproducibility-bearing configuration (data + interface).

Institutional realism (net-of-cost, borrow/availability, participation-aware impact, corporate
actions, capacity) is declared by reference/parameter; the deterministic engine applies it (BT-2,
P3-16). No algorithm here. Changing the configuration creates a new backtest version.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class CostModelReference:
    """Reference to the net-of-cost model applied by the deterministic engine (BT-2, AD-1)."""

    model: Ref


@dataclass(frozen=True, slots=True)
class BacktestConfiguration:
    """An immutable backtest configuration bound into the run manifest for reproducibility (RP-1).

    ``feature_refs`` reference features (Feature Service, canonical source); ``universe_ref`` is a
    survivorship-safe, as-of universe (PIT-2). ``parameters`` are non-secret label pairs (SEC-3).
    """

    config_hash: str
    feature_refs: tuple[Ref, ...]
    universe_ref: Ref
    horizon: str
    cost_model: CostModelReference
    parameters: tuple[tuple[str, str], ...]


class BacktestConfigurationService(Protocol):
    """Configures a backtest (immutable once set). Interface only."""

    def configure(self, backtest: EntityId, configuration: BacktestConfiguration) -> None: ...
PY
btreadme "$D" "configuration" \
"Define BacktestConfiguration, CostModelReference, and BacktestConfigurationService: the immutable, reproducibility-bearing configuration with institutional-realism references." \
"Represent configuration (config hash, feature/universe references, horizon, cost model, non-secret params) as immutable data bound into the manifest; declare realism by reference; hold no algorithm." \
"Consumed by model, scenario, engine, simulation_coordination; references features/universe by identity." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (BT-2, AD-1, PIT-2, RP-1, SEC-3, SE-2); Architecture V2 §5.6; RB-11 · BT; P3-16."

# ===========================================================================
# scenario
# ===========================================================================
D="$SRC/scenario"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Scenario Management — named scenario variants over a configuration (data + interface)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class BacktestScenario:
    """A named, immutable scenario (parameter/regime variant) over a configuration."""

    name: str
    config_hash: str
    overrides: tuple[tuple[str, str], ...]


class ScenarioManagementService(Protocol):
    """Defines and lists scenarios for a backtest. Interface only."""

    def define_scenario(self, backtest: EntityId, scenario: BacktestScenario) -> None: ...
PY
btreadme "$D" "scenario" \
"Define BacktestScenario and ScenarioManagementService: named scenario variants over a configuration." \
"Represent scenarios as immutable data with a management interface; hold no logic." \
"Consumed by engine, session, scenario_comparison." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (CP-2, RP-1); Architecture V2 §5.6; RB-11 · BT."

# ===========================================================================
# context
# ===========================================================================
D="$SRC/context"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Context — the immutable, deterministic execution context (simulated clock)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AsOf


@dataclass(frozen=True, slots=True)
class BacktestContext:
    """Immutable execution context for a backtest run.

    Time is SIMULATED via the injected clock (``as_of``); reading wall-clock time during simulation is
    PROHIBITED (PIT-4, BT-1). The RNG ``seed_ref`` and ``hardware_class`` are recorded in the Run
    Manifest for reproducibility (P1-02); no ambient non-determinism.
    """

    as_of: AsOf
    seed_ref: str
    hardware_class: str
PY
btreadme "$D" "context" \
"Define BacktestContext: the immutable, deterministic execution context (simulated clock as-of, seed reference, hardware class)." \
"Carry the simulated-time boundary and reproducibility inputs by value; prohibit wall-clock reads; hold no logic." \
"Consumed by engine, session, simulation_coordination." \
"core_domain.shared (AsOf); standard library." \
"CLAUDE.md (PIT-4, BT-1, CS-3, RP-1); Architecture V2 §5.6, §2.1; RB-11 · BT; P1-02."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Model — the canonical backtest aggregate and value objects (data only).

A backtest is a deterministic, reproducible historical simulation of a subject (feature/signal/
strategy) within an experiment. It references its subject/experiment by identity and binds a Run
Manifest (reproducibility spine). It holds NO simulation algorithm and NO statistics.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AggregateRoot, Provenance, Ref, RunManifestRef, Version

from backtesting_service.status import BacktestStatus


@dataclass(frozen=True, slots=True)
class BacktestIdentifier:
    """A stable, versioned identity for a backtest (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class BacktestEvidence:
    """Reproducible performance evidence — a reference to the immutable result artifact, not numbers.

    The backtest produces evidence; significance is the deterministic Validation engine's (AI-2, SI-3).
    """

    summary: str
    result_manifest: RunManifestRef


@dataclass(eq=False)
class Backtest(AggregateRoot):
    """A backtest (aggregate root): a deterministic, reproducible historical simulation.

    It is NOT production execution and holds NO simulation algorithm/statistics. It binds a Run
    Manifest (P1-02) so it reproduces bit-for-bit; its result is immutable (BT-3) and never manually
    edited (BT-4).
    """

    identifier: BacktestIdentifier
    experiment: Ref   # -> experiment_service (canonical experiment source)
    subject: Ref      # -> feature/signal/strategy under test (by identity)
    manifest: RunManifestRef
    status: BacktestStatus
    provenance: Provenance
PY
btreadme "$D" "model" \
"Define the canonical backtest models: Backtest (aggregate), BacktestIdentifier, BacktestEvidence (reproducible evidence reference)." \
"Represent a backtest as an immutable, manifest-bearing, reproducible aggregate that references its subject/experiment by identity; hold no simulation algorithm, no statistics, no adjudication." \
"Consumed by every Backtesting Engine module; references Experiment/Feature by identity; reuses the reproducibility spine." \
"core_domain.shared (AggregateRoot, Provenance, Ref, RunManifestRef, Version); status." \
"CLAUDE.md (BT-1..4, CP-2/4/5/7, RP-1, AI-2, SI-3, NM-2); Architecture V2 §5.6, §6.3; RB-11 · BT; P1-02."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Metadata — the immutable, auditable metadata of a backtest (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from backtesting_service.model import BacktestIdentifier
from backtesting_service.status import BacktestStatus


@dataclass(frozen=True, slots=True)
class BacktestMetadata:
    """Immutable metadata for a backtest (auditable, provenance-bearing)."""

    identifier: BacktestIdentifier
    description: str
    owner_role: str
    status: BacktestStatus
    provenance: Provenance
    tags: tuple[str, ...]
PY
btreadme "$D" "metadata" \
"Define BacktestMetadata: the immutable, auditable, provenance-bearing metadata of a backtest." \
"Carry backtest metadata (identity, description, owner, status, provenance, tags) as data; hold no logic." \
"Consumed by management/reporting and repositories." \
"core_domain.shared (Provenance); model; status." \
"CLAUDE.md (CP-7, DP-3); Architecture V2 §5.6; RB-11 · BT."

# ===========================================================================
# session
# ===========================================================================
D="$SRC/session"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Session — an immutable record of a backtest run session (binds run inputs to a manifest)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef

from backtesting_service.context import BacktestContext
from backtesting_service.scenario import BacktestScenario


@dataclass(frozen=True, slots=True)
class BacktestSession:
    """An immutable record binding a backtest + scenario + context to a Run Manifest (reproducibility)."""

    backtest_id: EntityId
    scenario: str
    manifest: RunManifestRef


class BacktestSessionService(Protocol):
    """Opens/closes a deterministic backtest run session. Interface only — no execution here."""

    def open_session(
        self, backtest: EntityId, scenario: BacktestScenario, context: BacktestContext
    ) -> BacktestSession: ...
    def close_session(self, session: EntityId) -> None: ...
PY
btreadme "$D" "session" \
"Define BacktestSession and BacktestSessionService: an immutable run-session record and its open/close interface." \
"Bind a run's inputs (backtest, scenario, context) to a Run Manifest as an immutable session; hold no execution or logic." \
"Consumed by engine and simulation_coordination; references scenario/context." \
"core_domain.shared (EntityId, RunManifestRef); context; scenario." \
"CLAUDE.md (CP-2, RP-1, OB-1); Architecture V2 §5.6; RB-11 · BT; P1-02."

# ===========================================================================
# simulation_coordination
# ===========================================================================
D="$SRC/simulation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Historical Simulation Coordination — coordinates the deterministic simulation (no algorithm here).

Delegates to the deterministic simulation engine, reads only point-in-time data via the As-Of Gateway
(PIT-1/4), and applies institutional realism (costs/borrow/impact/capacity) by reference (BT-2, P3-16).
It is NOT production execution and has NO market connectivity.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef

from backtesting_service.context import BacktestContext


class HistoricalSimulationCoordinator(Protocol):
    """Coordinates a deterministic historical simulation over the simulated clock. Interface only.

    It prepares the run and returns the Run Manifest of the produced (reproducible) result; it runs no
    algorithm, reads no wall-clock time, and connects to no broker/market.
    """

    def prepare(self, backtest: EntityId, context: BacktestContext) -> None: ...
    def coordinate_run(self, backtest: EntityId) -> RunManifestRef: ...
PY
btreadme "$D" "simulation_coordination" \
"Define HistoricalSimulationCoordinator: coordinate the deterministic historical simulation over the simulated clock." \
"Delegate to the deterministic simulation engine; read only PIT data via the As-Of Gateway; apply realism by reference; run no algorithm and no market connectivity; hold no logic." \
"core_domain.shared (EntityId, RunManifestRef); context; delegates to the deterministic simulation engine." \
"Consumed by engine; precedes validation_coordination." \
"CLAUDE.md (BT-1/2, PIT-1/4, DE-1, RP-1); Architecture V2 §5.6, §6.3, §6.4; RB-11 · BT; P3-16, P1-02."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Validation Coordination — orchestrates validation via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the backtest to the deterministic
Validation engine (deflation/PBO/holdout/replication). It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class BacktestValidationCoordinator(Protocol):
    """Coordinates a backtest's validation before COMPLETED/APPROVED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; deflation/PBO/holdout/
    replication and the promotion decision are the deterministic Validation engine's (SI-3, P2-*).
    """

    def request_validation(self, backtest: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, backtest: EntityId) -> ValidationReport: ...
PY
btreadme "$D" "validation_coordination" \
"Define BacktestValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation engine." \
"Coordinate validation; defer deflation/PBO/holdout/replication and promotion to the deterministic engine; assert no significance; hold no logic." \
"core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to COMPLETED." \
"CLAUDE.md (AI-2, DE-1, SI-3, VS-1..4); Architecture V2 §5.6, §6.3; RB-04 · VAL; RB-01 · STAT; P2-05..09."

# ===========================================================================
# performance_reporting
# ===========================================================================
D="$SRC/performance_reporting"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Performance Reporting — the performance report model and reporting INTERFACE (references, not stats).

Metrics are DEFLATED and computed by the deterministic Statistics engine (SI-3); this model holds
references/attribution/capacity, NOT the calculations. No statistics here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref, RunManifestRef


@dataclass(frozen=True, slots=True)
class ExecutionSummary:
    """A summary of the simulated execution (references, not computed statistics)."""

    trade_count: int
    fills_ref: Ref
    turnover_ref: Ref


@dataclass(frozen=True, slots=True)
class PerformanceReport:
    """An immutable performance report referencing deterministic outputs by manifest.

    Metrics are deflated by the deterministic Statistics engine (SI-3); attribution and capacity are
    referenced (BT-3). Presenting undeflated performance as evidence is PROHIBITED (SI-3).
    """

    backtest_id: EntityId
    result_manifest: RunManifestRef
    metrics_ref: Ref       # -> deterministic, deflated metrics artifact
    attribution_ref: Ref
    capacity_ref: Ref
    execution: ExecutionSummary


class PerformanceReportingService(Protocol):
    """Generates an immutable performance report from a completed backtest. Interface only."""

    def generate(self, backtest: EntityId) -> PerformanceReport: ...
PY
btreadme "$D" "performance_reporting" \
"Define PerformanceReport, ExecutionSummary, and PerformanceReportingService: the immutable performance report model and its generation interface." \
"Aggregate deterministic outputs by reference (deflated metrics, attribution, capacity, execution summary); compute no statistics; present nothing undeflated; hold no logic." \
"core_domain.shared (EntityId, Ref, RunManifestRef); references the deterministic Statistics engine outputs." \
"Consumed by result_management and scenario_comparison." \
"CLAUDE.md (SI-3, BT-3, CP-2, AI-2); Architecture V2 §5.6; RB-11 · BT; RB-01 · STAT."

# ===========================================================================
# result_management
# ===========================================================================
D="$SRC/result_management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Result Management — the immutable backtest result model and management INTERFACE (no manual edits)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref, RunManifestRef


@dataclass(frozen=True, slots=True)
class BacktestResult:
    """An immutable, reproducible backtest result artifact (BT-3).

    It references the deterministic outputs by manifest; a result is NEVER manually edited (BT-4).
    """

    backtest_id: EntityId
    manifest: RunManifestRef
    performance: Ref   # -> performance report artifact
    reproducible: bool


class BacktestResultService(Protocol):
    """Records and retrieves immutable results. Interface only.

    A result MUST NOT be manually manipulated to improve it (BT-4); results are append-only.
    """

    def record(self, result: BacktestResult) -> None: ...
    def get(self, backtest: EntityId) -> BacktestResult: ...
PY
btreadme "$D" "result_management" \
"Define BacktestResult and BacktestResultService: the immutable, reproducible result artifact and its record/retrieve interface." \
"Represent results as immutable, manifest-referenced artifacts; forbid manual editing (BT-4); append-only; hold no persistence." \
"core_domain.shared (EntityId, Ref, RunManifestRef); references performance report." \
"Consumed by engine, scenario_comparison, repositories." \
"CLAUDE.md (BT-3/4, CP-2, RP-1, FB-9); Architecture V2 §5.6; RB-11 · BT; P1-02."

# ===========================================================================
# scenario_comparison
# ===========================================================================
D="$SRC/scenario_comparison"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Scenario Comparison — the immutable scenario-comparison model and INTERFACE (references only)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class ScenarioComparison:
    """An immutable comparison across scenarios (references to each scenario's result artifact)."""

    baseline: str
    scenarios: tuple[str, ...]
    result_refs: tuple[Ref, ...]


class ScenarioComparisonService(Protocol):
    """Compares scenario results deterministically (references only; no statistics). Interface only."""

    def compare(self, backtest: EntityId, scenarios: tuple[str, ...]) -> ScenarioComparison: ...
PY
btreadme "$D" "scenario_comparison" \
"Define ScenarioComparison and ScenarioComparisonService: the immutable comparison across scenarios." \
"Represent scenario comparisons as immutable references to result artifacts; compute no statistics; hold no logic." \
"core_domain.shared (EntityId, Ref); references result artifacts." \
"Consumed by reporting/management; emits ScenarioCompared." \
"CLAUDE.md (CP-2, SI-3, AI-2); Architecture V2 §5.6; RB-11 · BT."

# ===========================================================================
# reproducibility
# ===========================================================================
D="$SRC/reproducibility"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Reproducibility Management — the reproducibility spine INTERFACE for a backtest (no persistence).

Binds the Run Manifest (code hash, dependency lock, container digest, RNG seeds, hardware class,
as-of dataset references, config hash), verifies bit-for-bit reproduction, and enables replay from
the manifest (P1-02, RP-1/2, EX-2). No optimization without reproducibility (RP-2, FB-10).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef


class ReproducibilityManager(Protocol):
    """Manages the reproducibility spine for a backtest. Interface only.

    ``replay`` reproduces a run from its manifest as a new, verifiable run (never mutating the
    original); ``verify_reproducible`` checks bit-for-bit reproduction.
    """

    def bind_manifest(self, backtest: EntityId, manifest: RunManifestRef) -> None: ...
    def replay(self, backtest: EntityId) -> RunManifestRef: ...
    def verify_reproducible(self, backtest: EntityId) -> bool: ...
PY
btreadme "$D" "reproducibility" \
"Define ReproducibilityManager: bind the Run Manifest, verify bit-for-bit reproduction, and enable replay from the manifest." \
"Manage the reproducibility spine (manifest binding, replay, verification); enforce no optimization without reproducibility; hold no persistence." \
"core_domain.shared (EntityId, RunManifestRef); realizes the reproducibility spine (P1-02)." \
"Consumed by engine and lifecycle (replay/revalidation)." \
"CLAUDE.md (RP-1/2, CP-4, EX-2, FB-10); Architecture V2 §5.6, §5.10; RB-05 · REPRO; RB-11 · BT; P1-02."

# ===========================================================================
# engine
# ===========================================================================
D="$SRC/engine"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Engine & Runner Interfaces — the deterministic engine contract (no algorithm here).

The concrete engine is versioned, golden-tested, and reproducible (DE-1/2); the SAME engine runs
backtest/paper/live differing only by injected clock and adapter (AV2-23). No simulation algorithm,
no statistics, no broker/market connectivity here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef

from backtesting_service.context import BacktestContext
from backtesting_service.result_management import BacktestResult
from backtesting_service.scenario import BacktestScenario


class BacktestEngine(Protocol):
    """The deterministic backtest engine. Interface only.

    ``run`` executes a deterministic simulation under the injected (simulated) clock and returns the
    Run Manifest of the reproducible result. It reads only point-in-time data (PIT-1/4) and never
    connects to a broker/market.
    """

    def run(self, backtest: EntityId, context: BacktestContext) -> RunManifestRef: ...


class BacktestRunner(Protocol):
    """Coordinates a single deterministic run of a scenario under a context. Interface only."""

    def execute(
        self, backtest: EntityId, scenario: BacktestScenario, context: BacktestContext
    ) -> BacktestResult: ...
PY
btreadme "$D" "engine" \
"Define BacktestEngine and BacktestRunner: the deterministic engine and runner interfaces." \
"Express deterministic, reproducible run execution as interfaces (same engine for backtest/paper/live by injected clock); hold no simulation algorithm, statistics, or connectivity." \
"core_domain.shared (EntityId, RunManifestRef); context; scenario; result_management." \
"The concrete engine plugs in behind these interfaces (golden-tested, reproducible)." \
"CLAUDE.md (DE-1/2, BT-1, PIT-4, RP-1, AV2-23); Architecture V2 §5.6, §5.9, §6.3; RB-11 · BT; P1-02."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Policies — deterministic policy INTERFACES governing backtests (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class BacktestPolicy(Protocol):
    """Marker for a deterministic, versioned backtest policy."""

    ...


class PointInTimePolicy(Protocol):
    """The backtest runs on the simulated clock; wall-clock reads are PROHIBITED (PIT-4, BT-1). Interface only."""

    def uses_simulated_clock(self, backtest: EntityId) -> bool: ...


class ReproducibilityPolicy(Protocol):
    """No backtest result without a captured manifest ('no optimization without reproducibility', RP-2). Interface only."""

    def has_manifest(self, backtest: EntityId) -> bool: ...


class NetOfCostPolicy(Protocol):
    """Performance is net of realistic costs; gross performance is PROHIBITED (BT-2, AD-1). Interface only."""

    def is_net_of_cost(self, backtest: EntityId) -> bool: ...


class NoManualEditPolicy(Protocol):
    """A backtest result is never manually edited to improve it (BT-4). Interface only."""

    def is_unedited(self, backtest: EntityId) -> bool: ...


class NoProductionExecutionPolicy(Protocol):
    """A backtest never performs production execution or connects to a broker/market. Interface only."""

    def is_simulation_only(self, backtest: EntityId) -> bool: ...
PY
btreadme "$D" "policies" \
"Define the deterministic backtest policy interfaces: BacktestPolicy, PointInTimePolicy, ReproducibilityPolicy, NetOfCostPolicy, NoManualEditPolicy, NoProductionExecutionPolicy." \
"Express the backtesting-standards rules (simulated clock, reproducibility, net-of-cost, no manual edits, no production execution) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by engine/management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (BT-1..4, PIT-4, RP-2, AD-1, DE-1); Architecture V2 §5.6, §6.3; RB-11 · BT; P1-02, P3-16."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Specifications — composable STRUCTURAL predicates over backtests (no statistics).

These check structural readiness/reproducibility/realism prerequisites, NOT statistical significance
or promotion — those are the deterministic Statistics/Validation engines' decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TBacktest = TypeVar("TBacktest", contravariant=True)


class BacktestSpecification(Protocol[TBacktest]):
    """A composable, deterministic structural predicate over a backtest. Interface only."""

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...


class ReadyToRunSpecification(Protocol[TBacktest]):
    """Structural readiness to run (configured, context has as-of + seed, survivorship-safe universe).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...


class ReproducibleSpecification(Protocol[TBacktest]):
    """Structural reproducibility check (has an immutable manifest + config hash, RP-1). Interface only."""

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...


class InstitutionalRealismSpecification(Protocol[TBacktest]):
    """Structural realism check (net-of-cost, borrow, participation-aware impact, capacity referenced).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, backtest: TBacktest) -> bool: ...
PY
btreadme "$D" "specifications" \
"Define composable STRUCTURAL backtest specifications: BacktestSpecification, ReadyToRunSpecification, ReproducibleSpecification, InstitutionalRealismSpecification." \
"Express reusable, composable structural readiness/reproducibility/realism predicates; never judge significance or decide promotion; hold no logic." \
"Composed by management; the promotion decision is the deterministic Statistics/Validation engines'." \
"Standard library only." \
"CLAUDE.md (DE-1, AI-2, BT-1/2, RP-1, SE-3); Architecture V2 §5.6, §6.3; RB-11 · BT; P3-16."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Domain Events — immutable facts about a backtest (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class BacktestCreated(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestConfigured(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestStarted(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestCompleted(DomainEvent):
    """The deterministic run completed and produced a reproducible result (BT-3)."""

    backtest_id: EntityId
    result_manifest: str


@dataclass(frozen=True, slots=True)
class BacktestValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided, not us)."""

    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestApproved(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestArchived(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class ScenarioCompared(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class PerformanceReportGenerated(DomainEvent):
    backtest_id: EntityId
PY
btreadme "$D" "events" \
"Define the canonical backtest domain events: BacktestCreated, BacktestConfigured, BacktestStarted, BacktestCompleted, BacktestValidated, BacktestApproved, BacktestArchived, ScenarioCompared, PerformanceReportGenerated." \
"Represent backtest lifecycle facts as immutable domain events; BacktestValidated records a deterministic-engine outcome, it does not assert it." \
"core_domain.shared (DomainEvent, EntityId)." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.6, §5.10; RB-11 · BT."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Errors — Backtesting Engine domain errors (each expresses a violated backtesting invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class BacktestError(DomainError):
    """Base for Backtesting Engine errors."""


class NonPointInTimeRead(BacktestError):
    """The simulation read wall-clock time or future-leaking data (PIT-4, BT-1, FB-7)."""


class IrreproducibleBacktest(BacktestError):
    """A backtest result lacks a manifest or cannot be reproduced bit-for-bit (RP-2, EX-2)."""


class ManualResultEdit(BacktestError):
    """A backtest result was manually edited to improve it (BT-4, FB-9)."""


class ProductionExecutionAttempt(BacktestError):
    """The engine attempted production execution or broker/market connectivity (out of scope)."""


class GrossPerformanceReported(BacktestError):
    """Performance was reported gross of realistic costs (BT-2, AD-1)."""


class UndeflatedPerformanceReported(BacktestError):
    """Undeflated performance was presented as evidence of discovery (SI-3)."""


class MissingCapacityAssessment(BacktestError):
    """A result lacks the required capacity assessment (BT-3, AD-4)."""


class IllegalBacktestTransition(BacktestError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
PY
btreadme "$D" "errors" \
"Define the Backtesting Engine errors: NonPointInTimeRead, IrreproducibleBacktest, ManualResultEdit, ProductionExecutionAttempt, GrossPerformanceReported, UndeflatedPerformanceReported, MissingCapacityAssessment, IllegalBacktestTransition." \
"Express violated backtesting invariants (point-in-time, reproducibility, no manual edits, no production execution, net-of-cost, deflation, capacity, lifecycle) as errors." \
"Used across the Backtesting Engine modules." \
"core_domain.shared (DomainError)." \
"CLAUDE.md (BT-1..4, PIT-4, RP-2, SI-3, AD-1/4, FB-7/9); Architecture V2 §5.6; RB-11 · BT; P3-16."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backtest Repository Interfaces — append-only, immutable repositories (no persistence).

Backtest results are immutable, reproducible artifacts (BT-3); they are append-only and never edited
(BT-4). No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from backtesting_service.model import Backtest
from backtesting_service.result_management import BacktestResult
from backtesting_service.session import BacktestSession


class BacktestRepositoryContract(Protocol):
    """Append-only repository of backtests (immutable; supersede, never mutate, CP-2)."""

    def get(self, backtest: EntityId) -> Backtest: ...
    def add(self, backtest: Backtest) -> None: ...


class BacktestResultRepository(Protocol):
    """Append-only repository of immutable, reproducible results (never edited, BT-3/4)."""

    def get(self, backtest: EntityId) -> BacktestResult: ...
    def add(self, result: BacktestResult) -> None: ...


class BacktestSessionRepository(Protocol):
    """Append-only repository of run sessions. Interface only."""

    def get(self, session: EntityId) -> BacktestSession: ...
    def add(self, session: BacktestSession) -> None: ...
PY
btreadme "$D" "repositories" \
"Define the Backtesting Engine repository interfaces: BacktestRepositoryContract, BacktestResultRepository, BacktestSessionRepository (all append-only)." \
"Express append-only, immutable retrieval of backtests, results, and sessions as interfaces; results are never edited (BT-4); hold no persistence." \
"Consumed by management/reporting/reproducibility." \
"core_domain.shared (EntityId); model; result_management; session." \
"CLAUDE.md (CP-2, BT-3/4, RP-4); Architecture V2 §5.6; RB-11 · BT; P1-02."

echo "Backtesting Engine generated."
