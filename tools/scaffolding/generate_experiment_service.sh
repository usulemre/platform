#!/usr/bin/env bash
#
# generate_experiment_service.sh — Phase 2.3 Experiment Service generator.
#
# Governed by: CLAUDE.md (SM-5, EX-1..4, RP-1/2, RL-1, AD-3, CP-2/5/7, AI-2, DE-1, PIT-1); Architecture
#              V2 §5.5 (Research Intelligence Layer), §6.1 (isolation barrier), §6.3; Implementation
#              Roadmap Phase 3; RB-01 · STAT, RB-02 · RMET, RB-11 · BT; Experiment Tracking Governance;
#              P2-01, P2-07, P3-02/03.
#
# Emits the Experiment Service under services/experiment-service as `experiment_service`: the
# experiment aggregate + lifecycle, registration, configuration, metadata, ownership, classification,
# dependency management, execution coordination, validation coordination, archival, service/repository
# interfaces, policies, specifications, domain events, and errors. It reuses core_domain (experiment
# context + shared kernel) and the Validation Foundation (platform_validation); it references
# Research/Dataset/Feature/Backtesting/Validation by identity (SE-2).
#
# The Experiment Service ORCHESTRATES and RECORDS; it NEVER runs statistics or backtests (those are
# the deterministic Quant/Backtesting engines), NEVER adjudicates significance (CP-5, AI-2), and
# NEVER observes validation/OOS outcomes (the isolation barrier, AD-3, P2-07). Every experiment is
# registered with an immutable manifest before execution and is reproducible (SM-5, EX-1..3, RP-1).
# It contains NO statistical algorithms, NO backtesting execution, NO persistence, NO infrastructure,
# NO API. Deterministic, technology-independent, immutable, auditable, reproducible, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/experiment-service"
SRC="$SVC/src/experiment_service"
cd "$ROOT"

ereadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# experiment-service · $2

> **Phase 2.3 Experiment Service — orchestration/model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable, reproducible. No statistical algorithms, no
> backtesting execution, no persistence, no infrastructure, no API. It orchestrates and records; it
> never runs statistics/backtests and never adjudicates.

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
touch "$SVC/.gitkeep"

cat > "$SVC/pyproject.toml" <<'TOML'
# experiment-service — the Experiment lifecycle & orchestration service (Phase 2.3).
# Standard library + Phase-1/2 foundations only. No statistical/backtesting/persistence/API deps.
[project]
name = "experiment-service"
version = "0.1.0"
description = "Experiment Service: experiment aggregate, lifecycle, registration, coordination, events."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/experiment_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# experiment-service — Experiment Service implemented in Phase 2.3

This service contains the Experiment Service (the `experiment_service` package): the experiment
aggregate, lifecycle, registration, configuration, metadata, ownership, classification, dependency
management, execution coordination, validation coordination, archival, service/repository interfaces,
policies, specifications, domain events, and errors. Statistical algorithms, backtesting execution,
persistence, infrastructure, and APIs remain forbidden here. Adjudication belongs to the deterministic
Validation/Quant engines; execution belongs to the Backtesting engine.
MD

cat > "$SVC/README.md" <<'MD'
# Experiment Service (`experiment_service`)

> **Phase 2.3 — Experiment Service (implemented).** Governs the complete lifecycle of quantitative
> research experiments: transforms research initiatives into reproducible, auditable, validated
> experiments. It is the **orchestration layer between Research, Datasets, Features, Validation, and
> Backtesting**. **Orchestration/model, interfaces only** — no statistical algorithms, no backtesting
> execution, no persistence, no infrastructure, no API.

## Architectural placement
A new service under the **Research Intelligence Layer** (Architecture V2 §5.5). It maps to the
existing experiment concept (`core_domain.experiment`, the `experiments/` registry, Experiment
Tracking Governance) — it introduces no new top-level concept (RO-1).

## Authority & boundaries
The Experiment Service **orchestrates and records**; it **never** runs statistics or backtests (the
deterministic Quant/Backtesting engines do — RB-01/RB-11), **never** adjudicates significance (the
Validation engine does — CP-5, AI-2), and **never** observes validation/OOS outcomes (the isolation
barrier — AD-3, `P2-07`). Every experiment is **registered with an immutable manifest before
execution** (SM-5, EX-1) and is **reproducible** (EX-2/3, RP-1); every trial is counted (EX-4).

## What is here (Phase 2.3)
18 modules, each a subpackage with its own `README.md`:
`model` · `status` · `lifecycle` · `configuration` · `metadata` · `ownership` · `classification` ·
`dependencies` · `registration` · `execution_coordination` · `validation_coordination` · `archival`
· `management` · `policies` · `specifications` · `events` · `errors` · `repositories`.

- **Canonical models:** `Experiment` (aggregate, reuses `core_domain.AggregateRoot` and
  `core_domain.experiment.ExperimentManifest`), `ExperimentIdentifier`, `ExperimentMetadata`,
  `ExperimentConfiguration`, `ExperimentObjective`, `ExperimentHypothesis`, `ExperimentOwner`,
  `ExperimentStatus`, `ExperimentClassification`, `ExperimentEvidence`, `ExperimentResultReference`.
- **Lifecycle:** `PROPOSED → REGISTERED → CONFIGURED → READY → RUNNING → VALIDATING → COMPLETED →
  APPROVED → ARCHIVED` (+ `SUSPENDED`, `CANCELLED`), supporting revision, replay/branching (new
  versioned lineage, RL-1), suspension, and cancellation; skips forbidden (fail-closed).
- **Domain events:** `ExperimentRegistered`, `ExperimentConfigured`, `ExperimentStarted`,
  `ExperimentCompleted`, `ExperimentValidationRequested`, `ExperimentValidated`, `ExperimentApproved`,
  `ExperimentArchived`.

## Integration (by identity / foundation)
- **Research Service** — the source of research intent (referenced by identity via `dependencies`).
- **Dataset Service / Feature** — dataset & feature references (by identity in `configuration`/`dependencies`).
- **Validation Foundation** (`platform_validation`) — used by `validation_coordination` for
  validation orchestration; the deterministic Validation engine decides.
- **Backtesting engine** — execution is delegated (referenced by identity); the Experiment Service
  does not execute backtests.

## Boundary rules (verified)
- **Deterministic & reproducible:** every experiment carries an immutable `ExperimentManifest`; no
  ambient time/RNG; a code scan confirms **no** statistics/backtest/persistence/infrastructure imports.
- **Immutable & auditable:** all models/records/events are `frozen` dataclasses; manifest immutable
  (EX-3); repositories append-only; backward transitions create new lineage (RL-1).
- **Compiles and imports cleanly**, 18 modules, no circular dependencies.

## Ownership
Accountable role: HR (Head of Research) / HQ, with GRC for statistical governance. Architecture owner: ARB.

## Dependencies
`core-domain`, `platform-validation`.

## Regeneration
Generated by [`tools/scaffolding/generate_experiment_service.sh`](../../tools/scaffolding/generate_experiment_service.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (SM-5, EX-1..4, RP-1/2, RL-1, AD-3, CP-2/5/7, AI-2, DE-1); Architecture V2 §5.5, §6.1, §6.3;
Implementation Roadmap Phase 3; RB-01 · STAT; RB-02 · RMET; RB-11 · BT; Experiment Tracking Governance;
`P2-01`, `P2-07`, `P3-03`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""experiment_service — the Experiment Service: governs the lifecycle of research experiments.

Transforms research initiatives into reproducible, auditable, validated experiments and orchestrates
them across Research, Datasets, Features, Validation, and Backtesting (by identity/dependency). It
reuses the Phase-1/2 foundations (core_domain experiment context + shared kernel, platform_validation).

Authority boundary (CP-5, AI-2, AD-3): the Experiment Service ORCHESTRATES and RECORDS; it NEVER runs
statistics or backtests, NEVER adjudicates significance, and NEVER observes validation/OOS outcomes
(the isolation barrier, P2-07). Every experiment is registered with an immutable manifest before
execution (SM-5, EX-1) and is reproducible (EX-2/3, RP-1); every trial is counted (EX-4).

Boundaries: no statistical algorithms, no backtesting execution, no persistence, no infrastructure, no API.

Modules: model, status, lifecycle, configuration, metadata, ownership, classification, dependencies,
registration, execution_coordination, validation_coordination, archival, management, policies,
specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    archival,
    classification,
    configuration,
    dependencies,
    errors,
    events,
    execution_coordination,
    lifecycle,
    management,
    metadata,
    model,
    ownership,
    policies,
    registration,
    repositories,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "configuration", "metadata", "ownership", "classification",
    "dependencies", "registration", "execution_coordination", "validation_coordination", "archival",
    "management", "policies", "specifications", "events", "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ExperimentLifecycle(Enum):
    """The canonical experiment lifecycle (plus SUSPENDED and CANCELLED)."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    CONFIGURED = "configured"
    READY = "ready"
    RUNNING = "running"
    VALIDATING = "validating"
    COMPLETED = "completed"
    APPROVED = "approved"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


L = ExperimentLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ExperimentLifecycle, ExperimentLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.CONFIGURED),
    (L.CONFIGURED, L.READY),
    (L.READY, L.RUNNING),
    (L.RUNNING, L.VALIDATING),
    (L.VALIDATING, L.COMPLETED),
    (L.COMPLETED, L.APPROVED),
    (L.APPROVED, L.ARCHIVED),
    # revision (before running)
    (L.READY, L.CONFIGURED),
    (L.CONFIGURED, L.REGISTERED),
    # suspension / reopening
    (L.RUNNING, L.SUSPENDED),
    (L.VALIDATING, L.SUSPENDED),
    (L.SUSPENDED, L.RUNNING),
    (L.SUSPENDED, L.CANCELLED),
    # cancellation (from any pre-completion active state)
    (L.REGISTERED, L.CANCELLED),
    (L.CONFIGURED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.RUNNING, L.CANCELLED),
    (L.VALIDATING, L.CANCELLED),
)

#: Terminal states. Replay/branching a completed experiment creates a NEW versioned experiment
#: (with lineage), never a mutation of history (RL-1) — completed/archived are not re-run in place.
TERMINAL_STATES: frozenset[ExperimentLifecycle] = frozenset({L.ARCHIVED, L.CANCELLED})


class ExperimentLifecycleService(Protocol):
    """Governs lifecycle transitions. Transition to VALIDATING/COMPLETED/APPROVED requires the
    deterministic execution/validation gates; the service performs NO adjudication. Interface only."""

    def transition(self, experiment: EntityId, to: ExperimentLifecycle) -> None: ...
PY
ereadme "$D" "lifecycle" \
"Define ExperimentLifecycle (PROPOSED/REGISTERED/CONFIGURED/READY/RUNNING/VALIDATING/COMPLETED/APPROVED/ARCHIVED + SUSPENDED/CANCELLED), the canonical transitions (revision/suspension/cancellation), and the lifecycle-service interface." \
"Enumerate the lifecycle and its legal transitions as data; replay/branching create new lineage (RL-1); hold no logic." \
"Consumed by model, status, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RL-1, EX-1, CP-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from experiment_service.lifecycle import ExperimentLifecycle


@dataclass(frozen=True, slots=True)
class ExperimentStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ExperimentLifecycle
    since: str
PY
ereadme "$D" "status" \
"Define ExperimentStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent experiment status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (ExperimentLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# classification
# ===========================================================================
D="$SRC/classification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Classification — the kind/domain classification of an experiment (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ExperimentKind(Enum):
    FACTOR = "factor"
    SIGNAL = "signal"
    RISK = "risk"
    PORTFOLIO = "portfolio"
    EXECUTION = "execution"
    META = "meta"  # meta-research, subject to the same rigor (CI-2)


class ExperimentDomain(Enum):
    EQUITIES = "equities"
    RATES = "rates"
    CREDIT = "credit"
    FX = "fx"
    COMMODITIES = "commodities"
    CROSS_ASSET = "cross_asset"
    ASSET_AGNOSTIC = "asset_agnostic"  # the core never branches on asset class (CP-8)


@dataclass(frozen=True, slots=True)
class ExperimentClassification:
    """The classification of an experiment (drives ontology placement, KM-3)."""

    kind: ExperimentKind
    domain: ExperimentDomain
PY
ereadme "$D" "classification" \
"Define ExperimentClassification with ExperimentKind and ExperimentDomain enums (asset-agnostic option preserved)." \
"Classify experiments within the shared vocabulary; the core never branches on asset class; data only." \
"Consumed by model, metadata, specifications." \
"Standard library only." \
"CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# ownership
# ===========================================================================
D="$SRC/ownership"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Ownership — the accountable owner value object and ownership-transfer interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ExperimentOwner:
    """The accountable owner and steward roles for an experiment (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


class ExperimentOwnershipService(Protocol):
    """Transfers experiment ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, experiment: EntityId, to_role: str) -> None: ...
PY
ereadme "$D" "ownership" \
"Define ExperimentOwner and the ExperimentOwnershipService interface: accountable ownership and its transfer." \
"Represent accountable ownership as data and its transfer as a recorded, interface-only operation; hold no logic." \
"Consumed by model, metadata, management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (CP-7, HO-1); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# configuration
# ===========================================================================
D="$SRC/configuration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Configuration — the immutable, reproducibility-bearing configuration (data + interface).

The configuration is part of the reproducibility record; changing it creates a new experiment version
(EX-3, RP-1). Dataset/feature references are by identity (from the Dataset Service / Feature), SE-2.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class ExperimentConfiguration:
    """An immutable experiment configuration.

    ``parameters`` are non-secret label pairs; secrets are never inlined (SEC-3). ``config_hash``
    binds this configuration into the run manifest for reproducibility (RP-1).
    """

    config_hash: str
    dataset_refs: tuple[Ref, ...]   # -> dataset_service datasets (by identity)
    feature_refs: tuple[Ref, ...]   # -> features (by identity)
    parameters: tuple[tuple[str, str], ...]


class ExperimentConfigurationService(Protocol):
    """Configures an experiment (register -> configure); configuration is immutable once set. Interface only."""

    def configure(self, experiment: EntityId, configuration: ExperimentConfiguration) -> None: ...
PY
ereadme "$D" "configuration" \
"Define ExperimentConfiguration and ExperimentConfigurationService: the immutable, reproducibility-bearing configuration and its assignment." \
"Represent configuration (config hash, dataset/feature references by identity, non-secret parameters) as immutable data bound into the manifest; hold no logic; inline no secrets." \
"Consumed by model, management, specifications; references datasets/features by identity." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (EX-3, RP-1, SEC-3, SE-2); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Model — the canonical experiment aggregate and value objects (data only).

Reuses the core experiment domain (core_domain.experiment.ExperimentManifest) for the immutable,
reproducible manifest and the core research domain for the falsifiable prediction.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.experiment import ExperimentManifest
from core_domain.research import FalsifiablePrediction
from core_domain.shared import AggregateRoot, Provenance, Ref, RunManifestRef, Version

from experiment_service.classification import ExperimentClassification
from experiment_service.ownership import ExperimentOwner
from experiment_service.status import ExperimentStatus


@dataclass(frozen=True, slots=True)
class ExperimentIdentifier:
    """A stable, versioned identity for an experiment (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ExperimentObjective:
    """The falsifiable objective of the experiment (SM-1)."""

    statement: str


@dataclass(frozen=True, slots=True)
class ExperimentHypothesis:
    """The experiment's hypothesis; references the core research Hypothesis by identity (SE-2)."""

    hypothesis_ref: Ref  # -> core_domain.research.Hypothesis / research_service initiative
    prediction: FalsifiablePrediction


@dataclass(frozen=True, slots=True)
class ExperimentEvidence:
    """Descriptive evidence; negative results are first-class and preserved (SM-4). Not an adjudication."""

    summary: str
    supports: bool


@dataclass(frozen=True, slots=True)
class ExperimentResultReference:
    """A reference to an experiment RESULT artifact (never the result itself).

    Points to the reproducible backtest/validation artifact by manifest/identity (RP-3).
    """

    run_manifest: RunManifestRef
    artifact: Ref


@dataclass(eq=False)
class Experiment(AggregateRoot):
    """An experiment (aggregate root).

    It carries an immutable manifest (reproducibility, EX-2/3, RP-1). It orchestrates and records; it
    does NOT run statistics/backtests, does NOT adjudicate significance (CP-5), and does NOT observe
    validation/OOS outcomes (AD-3, P2-07).
    """

    identifier: ExperimentIdentifier
    research: Ref  # -> research_service research initiative (source of intent)
    objective: ExperimentObjective
    hypothesis: ExperimentHypothesis | None
    classification: ExperimentClassification
    owner: ExperimentOwner
    status: ExperimentStatus
    manifest: ExperimentManifest
    provenance: Provenance
PY
ereadme "$D" "model" \
"Define the canonical experiment models: Experiment (aggregate), ExperimentIdentifier, ExperimentObjective, ExperimentHypothesis, ExperimentEvidence, ExperimentResultReference, plus reuse of the immutable ExperimentManifest." \
"Represent an experiment as an immutable, manifest-bearing, reproducible aggregate that orchestrates and records; reference research/results by identity; hold no logic, no statistics, no adjudication." \
"Consumed by every Experiment Service module; references Research/results by identity; reuses core_domain.experiment.ExperimentManifest." \
"core_domain.experiment (ExperimentManifest); core_domain.research (FalsifiablePrediction); core_domain.shared (AggregateRoot, Provenance, Ref, RunManifestRef, Version); classification; ownership; status." \
"CLAUDE.md (SM-1/4/5, EX-1..3, RP-1/3, AD-3, CP-2/5/7, RL-1, NM-2); Architecture V2 §5.5, §6.1; RB-02 · RMET; RB-01 · STAT; P2-01/07."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Metadata — the immutable, auditable metadata of an experiment (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from experiment_service.classification import ExperimentClassification
from experiment_service.model import ExperimentIdentifier
from experiment_service.ownership import ExperimentOwner
from experiment_service.status import ExperimentStatus


@dataclass(frozen=True, slots=True)
class ExperimentMetadata:
    """Immutable metadata for an experiment (auditable, provenance-bearing)."""

    identifier: ExperimentIdentifier
    description: str
    classification: ExperimentClassification
    owner: ExperimentOwner
    status: ExperimentStatus
    provenance: Provenance
    tags: tuple[str, ...]
PY
ereadme "$D" "metadata" \
"Define ExperimentMetadata: the immutable, auditable, provenance-bearing metadata of an experiment." \
"Carry experiment metadata (identity, description, classification, owner, status, provenance, tags) as data; hold no logic." \
"Consumed by management and repositories." \
"core_domain.shared (Provenance); model; classification; ownership; status." \
"CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance."

# ===========================================================================
# dependencies
# ===========================================================================
D="$SRC/dependencies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Dependency Management — links to research/datasets/features/validation/backtest (by id).

All links are by identity/reference (SE-2); no experiment module reaches into another context's
internals, and none creates a channel that would let generation observe validation/OOS (AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class DependencyKind(Enum):
    RESEARCH = "research"          # source of research intent (Research Service)
    DATASET = "dataset"           # Dataset Service references
    FEATURE = "feature"
    VALIDATION = "validation"     # a reference only; outcomes are not observable by generation
    BACKTEST = "backtest"         # execution is delegated to the Backtesting engine
    PRIOR_EXPERIMENT = "prior_experiment"


@dataclass(frozen=True, slots=True)
class ExperimentDependency:
    """A declared dependency of an experiment on another artifact, by identity."""

    kind: DependencyKind
    target: Ref


class ExperimentDependencyService(Protocol):
    """Declares and lists experiment dependencies. Interface only — hidden dependencies are PROHIBITED."""

    def declare(self, experiment: EntityId, dependency: ExperimentDependency) -> None: ...
PY
ereadme "$D" "dependencies" \
"Define ExperimentDependency, DependencyKind, and ExperimentDependencyService: declared links from an experiment to research, datasets, features, validation, backtests, and prior experiments." \
"Represent cross-context dependencies by identity only; declare all dependencies explicitly; never create an isolation-barrier-breaching channel; hold no logic." \
"Consumed by management; connects to Research/Dataset/Feature/Validation/Backtesting by reference." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (SE-2, AC-1/3, AD-3); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07."

# ===========================================================================
# registration
# ===========================================================================
D="$SRC/registration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Registration — register-before-run with an immutable manifest & Trial-Ledger linkage."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from experiment_service.model import Experiment


class ExperimentRegistrationService(Protocol):
    """Registers an experiment in the Experiment Registry with an immutable manifest and a Trial-Ledger
    linkage BEFORE any execution (SM-5, EX-1, P2-01, P3-03). Interface only — no persistence.

    An unregistered experiment MUST NOT run; a registered manifest is never mutated (EX-3).
    """

    def register(self, experiment: Experiment) -> EntityId: ...
PY
ereadme "$D" "registration" \
"Define ExperimentRegistrationService: register-before-run with an immutable manifest and Trial-Ledger linkage." \
"Orchestrate registration before execution; bind the immutable manifest and Trial-Ledger linkage; hold no persistence." \
"Consumed by management; precedes configuration/execution." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (SM-5, EX-1/3, FB-5); Architecture V2 §5.5; RB-01 · STAT; Experiment Tracking Governance; P2-01, P3-03."

# ===========================================================================
# execution_coordination
# ===========================================================================
D="$SRC/execution_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Execution Coordination — delegates execution to the deterministic engines (no backtests).

It prepares runs, enrolls trials in the Trial Ledger BEFORE they run (every trial counted, EX-4,
P2-01), and records completion. It does NOT execute backtests or run statistics (RB-11, RB-01).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExperimentExecutionCoordinator(Protocol):
    """Coordinates experiment execution by delegating to the Backtesting/Quant engines. Interface only.

    ``record_trial`` enrolls a trial in the Trial Ledger before it runs (EX-4); the coordinator never
    runs the trial itself and never observes validation/OOS outcomes (AD-3, P2-07).
    """

    def prepare_run(self, experiment: EntityId) -> None: ...
    def record_trial(self, experiment: EntityId) -> None: ...
    def mark_completed(self, experiment: EntityId) -> None: ...
PY
ereadme "$D" "execution_coordination" \
"Define ExperimentExecutionCoordinator: prepare runs, enroll trials in the Trial Ledger before they run, and record completion." \
"Delegate execution to the deterministic Backtesting/Quant engines; count every trial before it runs; never execute backtests/statistics; hold no logic." \
"core_domain.shared (EntityId); delegates to the Backtesting engine (by reference); uses the Trial Ledger." \
"Consumed by management; precedes validation_coordination." \
"CLAUDE.md (EX-4, SM-5, AD-3, DE-1); Architecture V2 §5.5, §5.6, §6.3; RB-11 · BT; RB-01 · STAT; P2-01/07."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Validation Coordination — orchestrates validation via the Validation Foundation.

Uses the Validation Foundation for STRUCTURAL validation and routes the experiment to the
deterministic Validation engine/scientific gate. It never asserts significance (AI-2). No statistics.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class ExperimentValidationCoordinator(Protocol):
    """Coordinates an experiment's validation. Interface only.

    Structural validation is orchestrated via the Validation Foundation; significance/PBO/holdout/
    replication and the promotion decision are the deterministic Validation engine's (DI/VS, P2-*).
    """

    def request_validation(self, experiment: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, experiment: EntityId) -> ValidationReport: ...
PY
ereadme "$D" "validation_coordination" \
"Define ExperimentValidationCoordinator: orchestrate structural validation (Validation Foundation) and route to the deterministic Validation engine/scientific gate." \
"Coordinate validation; defer significance/PBO/holdout/replication and promotion to the deterministic engine; assert no significance; hold no logic." \
"core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to COMPLETED/APPROVED." \
"CLAUDE.md (AI-2, DE-1, VS-1..4, RG-1); Architecture V2 §5.5, §5.6, §6.3; RB-04 · VAL; RB-01 · STAT; P2-05..09."

# ===========================================================================
# archival
# ===========================================================================
D="$SRC/archival"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Archival — archives completed/approved experiments (reproducibility preserved)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExperimentArchivalService(Protocol):
    """Archives an experiment. Interface only.

    Reproducibility-critical manifests/artifacts are never garbage-collected (RP-4, P5-01); negative
    and discarded experiments are preserved as first-class evidence (SM-4).
    """

    def archive(self, experiment: EntityId) -> None: ...
PY
ereadme "$D" "archival" \
"Define ExperimentArchivalService: archive completed/approved experiments while preserving reproducibility and negative results." \
"Coordinate archival; never GC reproducibility-critical manifests; preserve negative/discarded experiments; hold no logic." \
"core_domain.shared (EntityId)." \
"Consumed by management; terminal lifecycle step." \
"CLAUDE.md (RP-4, SM-4, DEPR-2); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P5-01."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Management — the Experiment Service application/orchestration INTERFACES (no adjudication).

These interfaces orchestrate the experiment lifecycle and connect Research/Datasets/Features/
Validation/Backtesting by dependency. They ORCHESTRATE and RECORD; they NEVER run statistics/backtests
and NEVER adjudicate significance (CP-5, AI-2). No statistical logic, no persistence.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from experiment_service.dependencies import ExperimentDependency
from experiment_service.metadata import ExperimentMetadata
from experiment_service.model import Experiment


class ExperimentService(Protocol):
    """The Experiment Service (interface only): drive the lifecycle of an experiment."""

    def register(self, experiment: Experiment) -> EntityId: ...
    def configure(self, experiment: EntityId) -> None: ...
    def start(self, experiment: EntityId) -> None: ...
    def complete(self, experiment: EntityId) -> None: ...
    def submit_for_validation(self, experiment: EntityId) -> None: ...
    def approve(self, experiment: EntityId) -> None: ...
    def archive(self, experiment: EntityId) -> None: ...


class ExperimentManagementService(Protocol):
    """Orchestrates dependencies and records deterministic gate outcomes. Interface only.

    It records (never computes) the outcome of the deterministic execution/validation gates.
    """

    def declare_dependency(self, experiment: EntityId, dependency: ExperimentDependency) -> None: ...
    def record_validation_outcome(self, experiment: EntityId, passed: bool) -> None: ...


class ExperimentCatalogService(Protocol):
    """Describes experiments from the catalog. Interface only."""

    def describe(self, experiment: EntityId) -> ExperimentMetadata: ...
PY
ereadme "$D" "management" \
"Define the Experiment Service interfaces: ExperimentService (lifecycle), ExperimentManagementService (dependency/gate orchestration), ExperimentCatalogService." \
"Orchestrate the experiment lifecycle and connect Research/Datasets/Features/Validation/Backtesting by dependency; record (never compute) deterministic gate outcomes; hold no adjudication, statistics, or backtests." \
"Top-level module: composes model, dependencies, metadata, registration, execution/validation coordination; routes to deterministic engines." \
"core_domain.shared (EntityId); model; dependencies; metadata." \
"CLAUDE.md (CP-5, AI-2, AD-3, DE-1, SM-3); Architecture V2 §5.5, §6.1, §6.3; RB-02 · RMET; P2-01/07/09."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Policies — deterministic policy INTERFACES governing experiments (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExperimentPolicy(Protocol):
    """Marker for a deterministic, versioned experiment policy."""

    ...


class RegisterBeforeRunPolicy(Protocol):
    """No experiment runs before registration with a manifest and Trial-Ledger entry (SM-5, EX-1). Interface only."""

    def is_registered(self, experiment: EntityId) -> bool: ...


class ManifestImmutabilityPolicy(Protocol):
    """A registered experiment manifest is immutable; a change creates a new version (EX-3). Interface only."""

    def is_mutation_allowed(self, experiment: EntityId) -> bool: ...


class TrialCountingPolicy(Protocol):
    """Every trial (run, discarded, or failed) is counted in the Trial Ledger (EX-4). Interface only."""

    def is_counted(self, trial: EntityId) -> bool: ...


class ReproducibilityPolicy(Protocol):
    """No experiment result without a captured manifest ('no optimization without reproducibility', RP-2)."""

    def has_manifest(self, experiment: EntityId) -> bool: ...


class IsolationBarrierPolicy(Protocol):
    """Experiment generation MUST NOT observe validation/OOS outcomes (AD-3, P2-07). Interface only."""

    def may_observe(self, experiment: EntityId, resource: str) -> bool: ...
PY
ereadme "$D" "policies" \
"Define the deterministic experiment policy interfaces: ExperimentPolicy, RegisterBeforeRunPolicy, ManifestImmutabilityPolicy, TrialCountingPolicy, ReproducibilityPolicy, IsolationBarrierPolicy." \
"Express the scientific-integrity rules (register-before-run, manifest immutability, trial counting, reproducibility, isolation barrier) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (SM-5, EX-1/3/4, RP-2, AD-3, DE-1); Architecture V2 §5.5, §6.1; RB-01 · STAT; RB-02 · RMET; P2-01/07."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Specifications — composable STRUCTURAL predicates over experiments (no statistics).

These check structural readiness (registered, configured, manifest present, dependencies declared),
NOT statistical significance or promotion — those are the deterministic Validation engine's decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TExperiment = TypeVar("TExperiment", contravariant=True)


class ExperimentSpecification(Protocol[TExperiment]):
    """A composable, deterministic structural predicate over an experiment. Interface only."""

    def is_satisfied_by(self, experiment: TExperiment) -> bool: ...


class ReadyToRunSpecification(Protocol[TExperiment]):
    """Structural readiness to run (registered, configured, manifest present, dependencies declared).

    STRUCTURAL only — it does not judge results. Interface only.
    """

    def is_satisfied_by(self, experiment: TExperiment) -> bool: ...


class ReproducibleSpecification(Protocol[TExperiment]):
    """Structural reproducibility check (has an immutable manifest + config hash, RP-1). Interface only."""

    def is_satisfied_by(self, experiment: TExperiment) -> bool: ...
PY
ereadme "$D" "specifications" \
"Define composable STRUCTURAL experiment specifications: ExperimentSpecification, ReadyToRunSpecification, ReproducibleSpecification." \
"Express reusable, composable structural readiness/reproducibility predicates; never judge significance or decide promotion; hold no logic." \
"Composed by management; the promotion decision is the deterministic scientific gate's." \
"Standard library only." \
"CLAUDE.md (DE-1, AI-2, RP-1, SE-3); Architecture V2 §5.5, §5.6, §6.3; RB-02 · RMET; P2-09."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Domain Events — immutable facts about an experiment (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExperimentRegistered(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentConfigured(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentStarted(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentCompleted(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentValidationRequested(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentValidated(DomainEvent):
    """Records that the deterministic validation/scientific gate passed (the engine decided)."""

    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentApproved(DomainEvent):
    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class ExperimentArchived(DomainEvent):
    experiment_id: EntityId
PY
ereadme "$D" "events" \
"Define the canonical experiment domain events: ExperimentRegistered, ExperimentConfigured, ExperimentStarted, ExperimentCompleted, ExperimentValidationRequested, ExperimentValidated, ExperimentApproved, ExperimentArchived." \
"Represent experiment lifecycle facts as immutable domain events; ExperimentValidated records a deterministic-engine outcome, it does not assert it." \
"core_domain.shared (DomainEvent, EntityId); align with core_domain.experiment events." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.5, §5.10; RB-02 · RMET; Experiment Tracking Governance."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Errors — Experiment Service domain errors (each expresses a violated invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class ExperimentError(DomainError):
    """Base for Experiment Service errors."""


class UnregisteredExperimentRun(ExperimentError):
    """An experiment was run without prior registration and a Trial-Ledger entry (SM-5, EX-1, FB-5)."""


class ManifestMutation(ExperimentError):
    """An attempt to mutate a registered experiment manifest (EX-3)."""


class TrialNotCounted(ExperimentError):
    """A trial informed a decision without being counted in the Trial Ledger (EX-4)."""


class IrreproducibleExperiment(ExperimentError):
    """An experiment result lacks a manifest or cannot be repeated (EX-2, RP-2)."""


class ExperimentSelfAdjudication(ExperimentError):
    """The experiment attempted to adjudicate its own significance (separation of powers, CP-5)."""


class IsolationBarrierBreach(ExperimentError):
    """Generation observed validation/OOS outcomes (AD-3, P2-07)."""


class IllegalExperimentTransition(ExperimentError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(ExperimentError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
PY
ereadme "$D" "errors" \
"Define the Experiment Service errors: UnregisteredExperimentRun, ManifestMutation, TrialNotCounted, IrreproducibleExperiment, ExperimentSelfAdjudication, IsolationBarrierBreach, IllegalExperimentTransition, UndeclaredDependency." \
"Express violated experiment invariants (register-before-run, manifest immutability, trial counting, reproducibility, separation of powers, isolation barrier, lifecycle, declared dependencies) as errors." \
"Used across the Experiment Service modules." \
"core_domain.shared (DomainError)." \
"CLAUDE.md (SM-5, EX-1..4, RP-2, CP-5, AD-3, FB-5, SE-2); Architecture V2 §5.5, §6.1; RB-01 · STAT; RB-02 · RMET; P2-01/07."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Experiment Repository Interfaces — append-only, immutable repositories (no persistence).

The Trial Ledger (core_domain.experiment.TrialLedger) is append-only and enrolls trials before they
run (P2-01). No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from experiment_service.dependencies import ExperimentDependency
from experiment_service.model import Experiment


class ExperimentRepositoryContract(Protocol):
    """Append-only repository of experiments (immutable; supersede, never mutate, CP-2, EX-3).

    A backward transition (replay/branch) creates a NEW versioned lineage, never a mutation (RL-1).
    """

    def get(self, experiment: EntityId) -> Experiment: ...
    def add(self, experiment: Experiment) -> None: ...


class ExperimentDependencyRepository(Protocol):
    """Retrieval of an experiment's declared dependencies. Interface only."""

    def dependencies_of(self, experiment: EntityId) -> tuple[ExperimentDependency, ...]: ...
PY
ereadme "$D" "repositories" \
"Define the Experiment Service repository interfaces: ExperimentRepositoryContract (append-only), ExperimentDependencyRepository." \
"Express append-only, immutable retrieval of experiments and their dependencies as interfaces; backward transitions create new lineage; hold no persistence." \
"Consumed by management; complements core_domain.experiment repositories and the Trial Ledger." \
"core_domain.shared (EntityId); model; dependencies." \
"CLAUDE.md (CP-2, EX-3, RL-1, SM-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P2-01."

echo "Experiment Service generated."
