#!/usr/bin/env bash
#
# generate_scheduler.sh — Phase 3.4 Scheduler Framework generator.
#
# Governed by: CLAUDE.md (DE-1 deterministic, CS-3 no ambient time, CP-2/7, WCON-1, RE-1/2, AC-1);
#              Architecture V2 §5.2 (orchestration), §5.4 (Workflow Control), §5.10; Implementation
#              Roadmap Phase 6; RB-20 · CODE; Workflow Contracts; P5-05/06.
#
# Emits the Scheduler Framework as a new shared library, `platform_scheduler`: scheduler core, job &
# schedule registries, trigger model, execution planner, execution window, retry policy, dependency
# management, job monitoring, scheduler metadata, job lifecycle, scheduling policies, scheduler events,
# and the error model. It depends only on the platform contract kernel and core_domain (for events).
#
# It is the DETERMINISTIC, VENDOR/TECHNOLOGY-INDEPENDENT scheduling abstraction: canonical interfaces
# ONLY. It supports dependency-aware scheduling, auditability, and replay. Triggers hold OPAQUE
# expressions (never cron-parsed here); execution windows are supplied (no wall-clock/timers). It
# contains NO cron parsing, NO timers, NO distributed scheduling, NO business logic, NO infrastructure.
# Deterministic, immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/scheduler"
SRC="$PKG/src/platform_scheduler"
cd "$ROOT"

# robust README helper (order: Purpose, Responsibilities, Relationships, Dependencies, Governance)
screadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# scheduler · $name

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

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
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# scheduler — the deterministic Scheduler Framework abstractions (Phase 3.4).
# Standard library + foundations only (contracts, core-domain for events). No cron/timer/infra deps.
[project]
name = "platform-scheduler"
version = "0.1.0"
description = "Deterministic scheduling abstractions: jobs, schedules, triggers, planner, dependencies."
requires-python = ">=3.12"
dependencies = ["platform-contracts", "core-domain"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_scheduler"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# scheduler — implemented in Phase 3.4

This shared library contains the Scheduler Framework (the `platform_scheduler` package): scheduler
core, job & schedule registries, trigger model, execution planner, execution window, retry policy,
dependency management, job monitoring, scheduler metadata, job lifecycle, scheduling policies,
scheduler events, and the error model. Cron parsing, timers, distributed scheduling, and infrastructure
remain forbidden here. The concrete scheduler/orchestrator (Temporal, per the TDR) plugs in behind
these interfaces.
MD

cat > "$PKG/README.md" <<'MD'
# scheduler (package) — `platform_scheduler`

> **Phase 3.4 — Scheduler Framework (implemented).** The deterministic orchestration layer that plans,
> triggers, coordinates, and monitors scheduled workloads across the platform — the authoritative
> scheduling system. **Abstractions only** — no cron, no timers, no distributed scheduling, no
> infrastructure.

## Purpose
Provide institutional, **deterministic**, dependency-aware scheduling abstractions used by services,
workflows, AI agents, and deterministic engines (AV2 §5.2/§5.4). Triggers hold **opaque** schedule
expressions (never cron-parsed here); execution windows are **supplied** (no wall-clock/timers). The
concrete scheduler/orchestrator (Temporal, per the [TDR](../../docs/architecture/technology_decision_record.md) §15)
plugs in **behind** these interfaces. Scheduler events subclass `core_domain.shared.DomainEvent` so
they flow on the Event Bus.

## What is here (Phase 3.4)
14 modules, each a subpackage with its own `README.md`:
`core` · `lifecycle` · `trigger` · `window` · `retry` · `dependencies` · `planner` · `job_registry`
· `schedule_registry` · `monitoring` · `metadata` · `policies` · `events` · `errors`.

- **Canonical models:** `ScheduledJob`, `Schedule`, `ScheduleIdentifier`, `Trigger`, `ExecutionWindow`,
  `JobDependency`, `RetryPolicy`, `SchedulePolicy`, `SchedulerContext`, `SchedulerMetadata`,
  `SchedulerRegistry`.
- **Job categories** (`core.JobCategory`): Dataset Ingestion · Data Quality Validation · Feature
  Generation · Experiment Execution · Backtesting · Risk Review · Signal Refresh · Portfolio
  Rebalancing · Execution Preparation · Governance Tasks · System Maintenance.
- **Lifecycle:** `REGISTERED → SCHEDULED → READY → RUNNING → COMPLETED → ARCHIVED`, with
  `FAILED → RETRYING → READY` (retry), plus `PAUSED` and `CANCELLED`, supporting pause, resume,
  cancellation, retry, and recovery; skips forbidden (fail-closed).
- **Domain events:** `JobRegistered`, `JobScheduled`, `JobStarted`, `JobCompleted`, `JobFailed`,
  `JobRetried`, `JobCancelled`, `ScheduleUpdated`, `ExecutionWindowOpened`, `ExecutionWindowClosed`.

## Boundary rules (verified)
- **Deterministic:** no timers/wall-clock (windows supplied, CS-3); triggers hold opaque expressions
  (no cron parsing); the planner is a `...` interface (no scheduling algorithm).
- **Dependency-aware:** `JobDependency` + `DependencyScheduler` + `ExecutionPlanner` produce a
  dependency-ordered plan; `DEPENDENCY_UNSATISFIED`/`CYCLIC_DEPENDENCY` errors.
- **Technology/vendor-independent:** stdlib + `platform_contracts`/`core_domain` only; a code scan
  confirms no cron/timer/distributed-scheduler/infra imports.
- **Auditable & replayable:** register-before-schedule; append-only registries; scheduler events;
  lifecycle supports recovery/retry.
- **Immutable:** all models/policies/events are `frozen` dataclasses (runtime `FrozenInstanceError`).
- **Compiles and imports cleanly**, 14 modules, no circular dependencies.

## Ownership
Accountable role: HSRE (platform / orchestration). Architecture owner: ARB.

## Dependencies
`platform_contracts`, `core_domain`.

## Regeneration
Generated by [`tools/scaffolding/generate_scheduler.sh`](../../tools/scaffolding/generate_scheduler.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (DE-1, CS-3, CP-2/7, WCON-1, RE-1/2, AC-1); Architecture V2 §5.2, §5.4, §5.10;
Implementation Roadmap Phase 6; RB-20 · CODE; Workflow Contracts; Technology Decision Record §15; `P5-05/06`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""platform_scheduler — the deterministic Scheduler Framework.

The deterministic orchestration layer responsible for planning, triggering, coordinating, and
monitoring scheduled workloads across the platform. It provides institutional scheduling abstractions
used by services, workflows, AI agents, and deterministic engines.

Determinism: triggers hold opaque schedule expressions (never cron-parsed here); execution windows are
supplied (no wall-clock/timers, CS-3); the planner is dependency-aware and reproducible. Scheduler
events subclass core_domain DomainEvent and flow on the Event Bus.

Boundaries: no cron parsing, no timers, no distributed scheduling, no business logic, no
infrastructure. The concrete scheduler/orchestrator (Temporal, per the TDR) plugs in behind these
interfaces.

Modules: core, lifecycle, trigger, window, retry, dependencies, planner, job_registry,
schedule_registry, monitoring, metadata, policies, events, errors.
"""
from __future__ import annotations

from . import (
    core,
    dependencies,
    errors,
    events,
    job_registry,
    lifecycle,
    metadata,
    monitoring,
    planner,
    policies,
    retry,
    schedule_registry,
    trigger,
    window,
)

__all__ = [
    "core", "lifecycle", "trigger", "window", "retry", "dependencies", "planner", "job_registry",
    "schedule_registry", "monitoring", "metadata", "policies", "events", "errors",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Job Lifecycle — the canonical job lifecycle states, transitions, status, and lifecycle service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class JobLifecycle(Enum):
    """The canonical job lifecycle (plus PAUSED and CANCELLED)."""

    REGISTERED = "registered"
    SCHEDULED = "scheduled"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    ARCHIVED = "archived"
    PAUSED = "paused"
    CANCELLED = "cancelled"


L = JobLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[JobLifecycle, JobLifecycle], ...] = (
    (L.REGISTERED, L.SCHEDULED),
    (L.SCHEDULED, L.READY),
    (L.READY, L.RUNNING),
    (L.RUNNING, L.COMPLETED),
    (L.COMPLETED, L.ARCHIVED),
    # failure / retry
    (L.RUNNING, L.FAILED),
    (L.FAILED, L.RETRYING),
    (L.RETRYING, L.READY),
    (L.FAILED, L.ARCHIVED),
    # recovery
    (L.FAILED, L.READY),
    # pause / resume
    (L.SCHEDULED, L.PAUSED),
    (L.READY, L.PAUSED),
    (L.PAUSED, L.SCHEDULED),
    # cancellation
    (L.SCHEDULED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.RUNNING, L.CANCELLED),
    (L.PAUSED, L.CANCELLED),
    (L.CANCELLED, L.ARCHIVED),
)

#: Terminal state. Replay re-runs a job as a NEW scheduled run (with lineage), never a mutation.
TERMINAL_STATES: frozenset[JobLifecycle] = frozenset({L.ARCHIVED})


@dataclass(frozen=True, slots=True)
class JobStatus:
    """The current lifecycle status of a job (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: JobLifecycle
    since: str


class JobLifecycleService(Protocol):
    """Governs job lifecycle transitions and supported operations. Interface only.

    Supports pause, resume, cancellation, retry, and recovery; no infrastructure or timers here.
    """

    def transition(self, job: Id, to: JobLifecycle) -> None: ...
    def pause(self, job: Id) -> None: ...
    def resume(self, job: Id) -> None: ...
    def cancel(self, job: Id) -> None: ...
    def retry(self, job: Id) -> None: ...
    def recover(self, job: Id) -> None: ...
PY
screadme "$D" "lifecycle" \
"Define JobLifecycle (REGISTERED/SCHEDULED/READY/RUNNING/COMPLETED/FAILED/RETRYING/ARCHIVED + PAUSED/CANCELLED), the canonical transitions, JobStatus, and the lifecycle service (pause/resume/cancel/retry/recover)." \
"Enumerate the job lifecycle and legal transitions as data and expose lifecycle operations; replay re-runs as a new scheduled run; hold no infrastructure or timers." \
"Consumed by core, metadata, monitoring, policies." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (WCON-1, RE-1, CS-3, RL-1); Architecture V2 §5.4; RB-20 · CODE; Workflow Contracts."

# ===========================================================================
# core
# ===========================================================================
D="$SRC/core"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Scheduler Core — the canonical job identity, categories, context, and the ScheduledJob model."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import CorrelationId, SchemaVersion

from platform_scheduler.lifecycle import JobStatus


class JobCategory(Enum):
    """The canonical categories of scheduled workloads across the platform."""

    DATASET_INGESTION = "dataset_ingestion"
    DATA_QUALITY_VALIDATION = "data_quality_validation"
    FEATURE_GENERATION = "feature_generation"
    EXPERIMENT_EXECUTION = "experiment_execution"
    BACKTESTING = "backtesting"
    RISK_REVIEW = "risk_review"
    SIGNAL_REFRESH = "signal_refresh"
    PORTFOLIO_REBALANCING = "portfolio_rebalancing"
    EXECUTION_PREPARATION = "execution_preparation"
    GOVERNANCE_TASKS = "governance_tasks"
    SYSTEM_MAINTENANCE = "system_maintenance"


@dataclass(frozen=True, slots=True)
class ScheduleIdentifier:
    """A stable, versioned identity for a schedule/job (NM-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class SchedulerContext:
    """Immutable, deterministic context for a scheduling decision.

    ``as_of`` is a supplied point-in-time boundary; the scheduler reads no wall-clock (CS-3).
    """

    correlation_id: CorrelationId
    as_of: str | None


@dataclass(frozen=True, slots=True)
class ScheduledJob:
    """A registered, deterministically schedulable job.

    ``target_ref`` references the work to run (a service/workflow/engine) by identity; the job holds no
    business logic and runs nothing itself.
    """

    identifier: ScheduleIdentifier
    category: JobCategory
    target_ref: str
    status: JobStatus
PY
screadme "$D" "core" \
"Define JobCategory (11 categories), ScheduleIdentifier, SchedulerContext, and the ScheduledJob model." \
"Provide the canonical job identity/category/context and the ScheduledJob (which references its work by identity); hold no business logic or timers." \
"Consumed by every Scheduler module; jobs reference services/workflows/engines by identity." \
"platform_contracts.common (CorrelationId, SchemaVersion); lifecycle (JobStatus)." \
"CLAUDE.md (DE-1, CS-3, SE-2, NM-2); Architecture V2 §5.2, §5.4; RB-20 · CODE; Workflow Contracts."

# ===========================================================================
# trigger
# ===========================================================================
D="$SRC/trigger"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Trigger Model — the canonical, declarative trigger (opaque expression; no cron parsing here)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class TriggerKind(Enum):
    TIME = "time"              # a time-based schedule (expression is opaque; not cron-parsed here)
    EVENT = "event"            # triggered by a domain event on the Event Bus
    DEPENDENCY = "dependency"  # triggered when upstream dependencies complete
    MANUAL = "manual"


@dataclass(frozen=True, slots=True)
class Trigger:
    """A declarative, immutable trigger.

    ``expression`` is an OPAQUE schedule expression interpreted by the concrete scheduler (NOT parsed
    here, no cron). ``event_ref`` names the domain event type for EVENT triggers.
    """

    kind: TriggerKind
    expression: str
    event_ref: str | None
PY
screadme "$D" "trigger" \
"Define Trigger and TriggerKind (time/event/dependency/manual): the canonical, declarative trigger with an opaque expression." \
"Represent triggers declaratively; hold an opaque schedule expression (never cron-parsed here); hold no timer or parsing logic." \
"Consumed by schedule_registry and planner; EVENT triggers reference Event Bus domain events." \
"Standard library only." \
"CLAUDE.md (DE-1, CS-3, AC-1); Architecture V2 §5.2, §5.4; RB-20 · CODE; Event Bus."

# ===========================================================================
# window
# ===========================================================================
D="$SRC/window"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Window — the canonical execution window (supplied boundaries; no wall-clock/timers)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ExecutionWindow:
    """An immutable execution window with supplied ISO-8601 boundaries (no wall-clock read, CS-3)."""

    opens_at: str
    closes_at: str
    timezone: str
PY
screadme "$D" "window" \
"Define ExecutionWindow: the canonical execution window with supplied ISO-8601 boundaries." \
"Represent execution windows as immutable, supplied data; hold no wall-clock reads or timers." \
"Consumed by schedule_registry and planner; drives ExecutionWindowOpened/Closed events." \
"Standard library only." \
"CLAUDE.md (DE-1, CS-3); Architecture V2 §5.4; RB-20 · CODE."

# ===========================================================================
# retry
# ===========================================================================
D="$SRC/retry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Retry Policy — retry/backoff as immutable policy data (values, not timers; no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class BackoffStrategy(Enum):
    NONE = "none"
    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    EXPONENTIAL_JITTER = "exponential_jitter"


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    """Declarative retry configuration for a job. ``base_delay_ms`` is a value; no timer here (CS-3)."""

    max_attempts: int
    backoff: BackoffStrategy
    base_delay_ms: int
PY
screadme "$D" "retry" \
"Define RetryPolicy and BackoffStrategy: retry/backoff for jobs as immutable configuration values." \
"Express retry semantics as declarative data; the concrete scheduler applies them; hold no timers or logic." \
"Consumed by schedule_registry and lifecycle (retry)." \
"Standard library only." \
"CLAUDE.md (RE-1, CS-3); Architecture V2 §5.4; RB-20 · CODE."

# ===========================================================================
# dependencies
# ===========================================================================
D="$SRC/dependencies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dependency Management — the job dependency model and dependency-scheduler INTERFACE (no algorithm).

Supports dependency-aware scheduling: a job runs only after its upstream dependencies are satisfied.
Dependencies are declared by identity (SE-2); no scheduling/cycle-detection algorithm here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class DependencyKind(Enum):
    COMPLETION = "completion"            # upstream job completed
    DATA_AVAILABILITY = "data_availability"  # upstream data available (as-of)
    APPROVAL = "approval"                # a governance approval was granted
    WINDOW = "window"                    # an execution window opened


@dataclass(frozen=True, slots=True)
class JobDependency:
    """A declared dependency of a job on an upstream artifact/job, by identity."""

    kind: DependencyKind
    upstream_ref: str


class DependencyScheduler(Protocol):
    """Resolves a job's dependencies and readiness deterministically. Interface only.

    A job is ready only when all its dependencies are satisfied; the concrete implementation performs
    the (acyclic) ordering. No scheduling algorithm or cycle-detection code here.
    """

    def dependencies_of(self, job: Id) -> tuple[JobDependency, ...]: ...
    def is_ready(self, job: Id) -> bool: ...
PY
screadme "$D" "dependencies" \
"Define JobDependency, DependencyKind, and the DependencyScheduler interface: dependency-aware scheduling." \
"Represent job dependencies by identity and expose deterministic readiness resolution; a job runs only after its dependencies are satisfied; hold no algorithm." \
"Consumed by planner and lifecycle; dependencies reference upstream jobs/data/approvals by identity." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (DE-1, SE-2, WCON-1); Architecture V2 §5.4; RB-20 · CODE; Workflow Contracts."

# ===========================================================================
# planner
# ===========================================================================
D="$SRC/planner"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Planner — the deterministic, dependency-aware execution plan model and planner INTERFACE.

Produces a reproducible, dependency-ordered plan honoring dependencies and execution windows. No
scheduling algorithm or timers here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_scheduler.core import SchedulerContext


@dataclass(frozen=True, slots=True)
class ExecutionPlanEntry:
    """An immutable entry in an execution plan: a job and its deterministic order."""

    job: Id
    order: int


@dataclass(frozen=True, slots=True)
class ExecutionPlan:
    """An immutable, reproducible, dependency-ordered execution plan."""

    entries: tuple[ExecutionPlanEntry, ...]


class ExecutionPlanner(Protocol):
    """Produces a deterministic, dependency-aware execution plan. Interface only — no algorithm/timers.

    The plan honors dependencies and execution windows and is reproducible from the context.
    """

    def plan(self, context: SchedulerContext) -> ExecutionPlan: ...
PY
screadme "$D" "planner" \
"Define ExecutionPlan, ExecutionPlanEntry, and the ExecutionPlanner interface: deterministic, dependency-aware execution planning." \
"Represent an execution plan as immutable, dependency-ordered data and expose deterministic, reproducible planning; hold no scheduling algorithm or timers." \
"core (SchedulerContext); consumes dependencies and windows; produces a plan for the concrete scheduler." \
"platform_contracts.common (Id); core (SchedulerContext); standard library." \
"CLAUDE.md (DE-1, RP-1, WCON-1); Architecture V2 §5.2, §5.4; RB-20 · CODE."

# ===========================================================================
# job_registry
# ===========================================================================
D="$SRC/job_registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Job Registry — the register-before-schedule registry of jobs (no persistence)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from platform_scheduler.core import ScheduledJob


class JobRegistry(Protocol):
    """Register-before-schedule registry of jobs. Interface only — no persistence.

    A job must be registered before it can be scheduled; registration is append-only.
    """

    def register(self, job: ScheduledJob) -> None: ...
    def get(self, job: Id) -> ScheduledJob: ...
    def is_registered(self, job: Id) -> bool: ...
PY
screadme "$D" "job_registry" \
"Define JobRegistry: the register-before-schedule registry of jobs." \
"Express register-before-schedule registration and retrieval of jobs as an interface; append-only; hold no persistence." \
"Consumed by planner/schedule_registry; complements the schedule registry." \
"platform_contracts.common (Id); core (ScheduledJob); standard library." \
"CLAUDE.md (CP-7, DE-1); Architecture V2 §5.4; RB-20 · CODE."

# ===========================================================================
# schedule_registry
# ===========================================================================
D="$SRC/schedule_registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Schedule Registry — the Schedule model and register-before-use SchedulerRegistry (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_scheduler.core import ScheduleIdentifier
from platform_scheduler.retry import RetryPolicy
from platform_scheduler.trigger import Trigger
from platform_scheduler.window import ExecutionWindow


@dataclass(frozen=True, slots=True)
class Schedule:
    """An immutable, versioned schedule binding a job to a trigger, optional window, and retry policy."""

    identifier: ScheduleIdentifier
    job_ref: Id
    trigger: Trigger
    window: ExecutionWindow | None
    retry_policy: RetryPolicy


class SchedulerRegistry(Protocol):
    """Register-before-use registry of schedules. Interface only — no persistence.

    Schedules are append-only and versioned; a change creates a new version.
    """

    def register(self, schedule: Schedule) -> None: ...
    def get(self, schedule: Id) -> Schedule: ...
PY
screadme "$D" "schedule_registry" \
"Define Schedule and the SchedulerRegistry interface: the schedule model (job + trigger + window + retry) and its register-before-use registry." \
"Represent schedules as immutable, versioned bindings and expose register-before-use registration; append-only; hold no persistence." \
"Consumed by planner and monitoring; binds jobs (core), triggers, windows, and retry policies." \
"platform_contracts.common (Id); core (ScheduleIdentifier); trigger (Trigger); window (ExecutionWindow); retry (RetryPolicy)." \
"CLAUDE.md (CP-2/7, VER-1/2); Architecture V2 §5.4; RB-20 · CODE; Workflow Contracts."

# ===========================================================================
# monitoring
# ===========================================================================
D="$SRC/monitoring"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Job Monitoring — the job run-status model and monitor INTERFACE (narrate only; no infra)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class JobHealth(Enum):
    HEALTHY = "healthy"
    DELAYED = "delayed"
    STUCK = "stuck"
    FAILED = "failed"
    UNKNOWN = "unknown"


@dataclass(frozen=True, slots=True)
class JobRunStatus:
    """An immutable job run status (``observed_at`` is a supplied ISO-8601 time, CS-3)."""

    job: Id
    health: JobHealth
    observed_at: str


class JobMonitor(Protocol):
    """Surfaces job run status/health for monitoring. Interface only — narrates; decides no halt.

    The concrete monitor plugs in behind this interface; no infrastructure here.
    """

    def status(self, job: Id) -> JobRunStatus: ...
PY
screadme "$D" "monitoring" \
"Define JobHealth, JobRunStatus, and the JobMonitor interface: job run monitoring." \
"Represent job run health as immutable data and expose a monitor interface that narrates only; hold no infrastructure or decision logic." \
"platform_contracts.common (Id); feeds Production Monitoring; drives DELAYED/STUCK detection." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (OB-1/3, EXP-3); Architecture V2 §5.4, §5.10; RB-20 · CODE; Production Monitoring Governance."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Scheduler Metadata — the immutable, auditable metadata of a scheduled job (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_scheduler.core import JobCategory, ScheduleIdentifier
from platform_scheduler.lifecycle import JobStatus


@dataclass(frozen=True, slots=True)
class SchedulerMetadata:
    """Immutable metadata for a scheduled job (auditable)."""

    identifier: ScheduleIdentifier
    category: JobCategory
    owner_role: str
    status: JobStatus
    tags: tuple[str, ...]
PY
screadme "$D" "metadata" \
"Define SchedulerMetadata: the immutable, auditable metadata of a scheduled job." \
"Carry scheduler metadata (identity, category, owner, status, tags) as data; hold no logic." \
"core (ScheduleIdentifier, JobCategory); lifecycle (JobStatus); consumed by monitoring/registry." \
"core (ScheduleIdentifier, JobCategory); lifecycle (JobStatus)." \
"CLAUDE.md (CP-7, OB-1); Architecture V2 §5.4; RB-20 · CODE."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Scheduling Policies — the versioned schedule policy model and governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id, SchemaVersion


@dataclass(frozen=True, slots=True)
class SchedulePolicy:
    """A named, versioned, deterministic schedule policy. Immutable; a change is a new version."""

    name: str
    version: SchemaVersion
    description: str


class DeterministicSchedulingPolicy(Protocol):
    """Scheduling is deterministic; no timers/wall-clock and no cron parsing (DE-1, CS-3). Interface only."""

    def is_deterministic(self, job: Id) -> bool: ...


class DependencyAwarePolicy(Protocol):
    """A job runs only after its declared dependencies are satisfied (dependency-aware). Interface only."""

    def dependencies_satisfied(self, job: Id) -> bool: ...


class RegisterBeforeSchedulePolicy(Protocol):
    """A job is registered before it can be scheduled. Interface only."""

    def is_registered(self, job: Id) -> bool: ...


class NoDistributedSchedulingPolicy(Protocol):
    """This layer performs no distributed scheduling or infrastructure (boundary). Interface only."""

    def is_abstraction_only(self, job: Id) -> bool: ...
PY
screadme "$D" "policies" \
"Define SchedulePolicy (versioned) and the governance policy interfaces: DeterministicSchedulingPolicy, DependencyAwarePolicy, RegisterBeforeSchedulePolicy, NoDistributedSchedulingPolicy." \
"Express the scheduling governance rules (deterministic, dependency-aware, register-before-schedule, no distributed scheduling) as interfaces; hold no logic." \
"Enforced by deterministic components; consumed by planner/lifecycle." \
"platform_contracts.common (Id, SchemaVersion); standard library." \
"CLAUDE.md (DE-1, CS-3, WCON-1); Architecture V2 §5.4; RB-20 · CODE."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Scheduler Domain Events — immutable facts about jobs/schedules (subclass the domain event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class JobRegistered(DomainEvent):
    job_id: EntityId


@dataclass(frozen=True, slots=True)
class JobScheduled(DomainEvent):
    job_id: EntityId
    schedule_id: EntityId


@dataclass(frozen=True, slots=True)
class JobStarted(DomainEvent):
    job_id: EntityId


@dataclass(frozen=True, slots=True)
class JobCompleted(DomainEvent):
    job_id: EntityId


@dataclass(frozen=True, slots=True)
class JobFailed(DomainEvent):
    job_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class JobRetried(DomainEvent):
    job_id: EntityId
    attempt: int


@dataclass(frozen=True, slots=True)
class JobCancelled(DomainEvent):
    job_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class ScheduleUpdated(DomainEvent):
    schedule_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionWindowOpened(DomainEvent):
    schedule_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionWindowClosed(DomainEvent):
    schedule_id: EntityId
PY
screadme "$D" "events" \
"Define the canonical scheduler domain events: JobRegistered, JobScheduled, JobStarted, JobCompleted, JobFailed, JobRetried, JobCancelled, ScheduleUpdated, ExecutionWindowOpened, ExecutionWindowClosed." \
"Represent scheduler lifecycle facts as immutable domain events carrying the domain event envelope; records, not commands." \
"core_domain.shared (DomainEvent, EntityId); flow on the Event Bus." \
"core_domain.shared (DomainEvent, EntityId)." \
"CLAUDE.md (CP-2/7, AC-1); Architecture V2 §5.4, §5.10; RB-20 · CODE; Event Bus."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, vendor-neutral Scheduler error model (no infrastructure details)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SchedulerErrorKind(Enum):
    UNREGISTERED_JOB = "unregistered_job"              # register-before-schedule
    DEPENDENCY_UNSATISFIED = "dependency_unsatisfied"  # dependency-aware scheduling
    CYCLIC_DEPENDENCY = "cyclic_dependency"            # a dependency cycle (must be acyclic)
    WINDOW_CLOSED = "window_closed"                    # the execution window is closed
    MAX_RETRIES_EXCEEDED = "max_retries_exceeded"      # retry policy exhausted
    ILLEGAL_TRANSITION = "illegal_transition"          # lifecycle transition not allowed (fail-closed)
    NON_DETERMINISTIC = "non_deterministic"            # a non-deterministic scheduling attempt (DE-1)


@dataclass(frozen=True, slots=True)
class SchedulerError:
    """A canonical, vendor-neutral scheduler error (no infrastructure/vendor details leaked)."""

    kind: SchedulerErrorKind
    message: str


class SchedulerFrameworkError(Exception):
    """Base exception for the Scheduler Framework (framework faults, not infrastructure errors)."""
PY
screadme "$D" "errors" \
"Define SchedulerError, SchedulerErrorKind, and SchedulerFrameworkError: the canonical, vendor-neutral error model." \
"Express scheduler errors in vendor-neutral terms (unregistered/dependency/cyclic/window/max-retries/transition/non-deterministic); leak no infrastructure details; hold no logic." \
"Used across the Scheduler modules." \
"Standard library only." \
"CLAUDE.md (DE-1, WCON-1, RE-1, CP-7); Architecture V2 §5.4; RB-20 · CODE."

echo "Scheduler Framework generated."
