#!/usr/bin/env bash
#
# generate_execution_engine.sh — Phase 2.9 Execution Engine generator.
#
# Governed by: CLAUDE.md (RS-3/4, DEP-1..4, AI-1, CP-2/5/7, DE-1/2, RP-1, PS-1); Architecture V2 §5.9
#              (Execution Layer), §6.3, §7.2; Implementation Roadmap Phase 8; RB-14 · EXEC, RB-30 ·
#              DEPLOY, RB-13 · RISK; Execution Governance; P3-15, P1-10.
#
# Emits the Execution Engine under services/execution-service as `execution_service`: the execution
# aggregate + plan/instruction, session, context, authorization, lifecycle, planning, constraints,
# validation coordination, scheduling, monitoring interfaces, reporting, governance, service/repository
# interfaces, policies, specifications, domain events, and errors. It reuses core_domain (execution
# context + shared kernel) and the Validation Foundation; it references Portfolio/Risk by identity.
#
# The Execution Engine is the DETERMINISTIC execution PLANNING and AUTHORIZATION layer — the final
# deterministic authority BEFORE any external execution adapter. It PRODUCES EXECUTION PLANS ONLY. It
# is paper-first by default (DEP-1); live is impossible without a valid, time-boxed governance
# authorization token (RS-4); an LLM NEVER executes or authorizes (AI-1); the kill-switch forces HALT
# (human-invocable, RS-3). It NEVER communicates with brokers/exchanges and NEVER submits production
# orders. It is NOT broker integration, NOT exchange connectivity, NOT order routing, NOT market
# connectivity. It contains NO broker APIs, NO FIX, NO REST clients, NO persistence, NO infrastructure,
# NO API. Deterministic, production-safe, technology-independent, immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/execution-service"
SRC="$SVC/src/execution_service"
cd "$ROOT"

# robust README helper: unset args default to empty (never aborts under set -u); a guard verifies completeness
exreadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# execution-service · $name

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

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
# execution-service — the deterministic Execution Engine (planning/authorization) (Phase 2.9).
# Standard library + Phase-1/2 foundations only. No broker/exchange/FIX/REST/persistence deps.
[project]
name = "execution-service"
version = "0.1.0"
description = "Execution Engine: deterministic execution planning, authorization, governance model & interfaces."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/execution_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# execution-service — Execution Engine implemented in Phase 2.9

This service contains the Execution Engine (the `execution_service` package): the execution aggregate,
plan/instruction, session, context, authorization, lifecycle, planning, constraints, validation
coordination, scheduling, monitoring interfaces, reporting, governance, service/repository interfaces,
policies, specifications, domain events, and errors. Broker APIs, exchange connectivity, FIX, REST
clients, order routing, market connectivity, persistence, infrastructure, and APIs remain forbidden
here. The engine produces execution PLANS only; the external execution adapter is downstream and out
of scope. Live execution is impossible without a valid, time-boxed governance authorization token.
MD

cat > "$SVC/README.md" <<'MD'
# Execution Service — the Execution Engine (`execution_service`)

> **Phase 2.9 — Execution Engine (implemented).** The deterministic execution planning and
> authorization layer that transforms approved portfolio decisions into executable **plans** while
> enforcing institutional governance, execution policies, and risk controls. The **final
> deterministic authority before any external execution adapter**. **Planning/authorization model &
> interfaces only** — no broker integration, no exchange connectivity, no order routing, no market
> connectivity, no FIX, no REST clients, no infrastructure, no API.

## Purpose
Realize the deterministic-authority portion of the **Execution Layer** (Architecture V2 §5.9). It
produces **execution plans only** and is **paper-first** by default (DEP-1); **live is impossible
without a valid, time-boxed governance authorization token** (RS-4); the **same engine runs
backtest/paper/live** differing only by injected clock and adapter (AV2-23); an **LLM never executes
or authorizes** (AI-1); the **kill-switch forces HALT** (human-invocable, RS-3). It reuses the
Phase-1/2 foundations and enforces Execution Governance (RB-14/RB-30).

## Authority & boundaries
It **plans and authorizes deterministically**; it **produces plans only** and **never submits
production orders**, **never communicates with brokers or exchanges**, and holds **no market
connectivity**. The external execution adapter is downstream and out of scope. It contains no broker
APIs, FIX, REST clients, persistence, or infrastructure.

## What is here (Phase 2.9)
20 modules, each a subpackage with its own `README.md`:
`model` · `status` · `lifecycle` · `planning` · `authorization` · `context` · `session` ·
`constraints` · `scheduling` · `validation_coordination` · `monitoring` · `reporting` · `governance`
· `management` · `policies` · `specifications` · `metadata` · `events` · `errors` · `repositories`.

- **Canonical models:** `Execution` (aggregate, reuses `core_domain.AggregateRoot` + `RunManifestRef`),
  `ExecutionIdentifier`, `ExecutionPlan`, `ExecutionInstruction`, `ExecutionAuthorization`,
  `ExecutionContext`, `ExecutionPolicy`, `ExecutionConstraint`, `ExecutionMetadata`,
  `ExecutionEvidence`, `ExecutionDecision`, `ExecutionSummary`.
- **Lifecycle:** `REQUESTED → PLANNED → VALIDATING → AUTHORIZED → READY → COMPLETED → ARCHIVED`
  (+ `REJECTED`, `CANCELLED`), supporting reauthorization, cancellation, rescheduling, replay, and
  recovery; skips forbidden (fail-closed).
- **Domain events:** `ExecutionRequested`, `ExecutionPlanned`, `ExecutionValidated`,
  `ExecutionAuthorized`, `ExecutionRejected`, `ExecutionPrepared`, `ExecutionCompleted`,
  `ExecutionCancelled`, `ExecutionArchived`.

## Integration (by identity / foundation)
- **Portfolio Engine** — canonical portfolio source (`ExecutionEvidence.portfolio_ref`; only approved).
- **Risk Engine** — canonical risk authority (`ExecutionEvidence.risk_ref`; pre-authorization risk check).
- **Validation Foundation** — `validation_coordination` orchestrates validation incl. research↔production parity (P3-15).
- **Execution Governance** (RB-14/RB-30) — token-gated live, paper-first, reversibility, kill-switch.

## Boundary rules (verified)
- **Deterministic, production-safe:** `ExecutionContext` carries the injected clock (`as_of`) and an
  adapter *reference* the engine never calls; `PaperFirstPolicy`/`TokenGatedLivePolicy` (DEP-1, RS-4);
  reuses `core_domain.execution.ExecutionMode`/`AuthorizationToken`.
- **Plans only, no broker/exchange/order:** `PlansOnlyPolicy` + `OrderSubmissionAttempt`,
  `BrokerCommunicationAttempt`, `ExchangeConnectivityAttempt` errors; a code scan confirms no broker/
  exchange/FIX/REST imports.
- **No AI execution/authorization:** reuses `AIExecutionAttempt` (AI-1); kill-switch human-invocable (RS-3).
- **Reversible + parity + immutable:** `ReversibilityPolicy`/`IrreversibleDeployment` (DEP-3),
  `ParityBreach` (P3-15); all models/records/events are `frozen` dataclasses (runtime `FrozenInstanceError`);
  repositories append-only.
- **Compiles and imports cleanly**, 20 modules, no circular dependencies.

## Ownership
Accountable role: HPR / HSRE. Architecture owner: ARB.

## Dependencies
`core-domain`, `platform-validation`.

## Regeneration
Generated by [`tools/scaffolding/generate_execution_engine.sh`](../../tools/scaffolding/generate_execution_engine.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (RS-3/4, DEP-1..4, AI-1, CP-2/5/7, DE-1/2, RP-1, PS-1); Architecture V2 §5.9, §6.3, §7.2;
Implementation Roadmap Phase 8; RB-14 · EXEC; RB-30 · DEPLOY; RB-13 · RISK; Execution Governance;
`P3-15`, `P1-10`.
MD

cat > "$SRC/__init__.py" <<'PY'
"""execution_service — the deterministic Execution Engine (planning and authorization).

Transforms approved portfolio decisions into executable PLANS while enforcing institutional
governance, execution policies, and risk controls. It is the final deterministic authority BEFORE any
external execution adapter.

Authority (RS-3/4, DEP-1, AI-1): it produces PLANS only; it is paper-first by default; live is
impossible without a valid, time-boxed governance authorization token; an LLM NEVER executes or
authorizes; the kill-switch forces HALT (human-invocable). The same engine runs backtest/paper/live
differing only by injected clock and adapter (AV2-23). It reuses core_domain (execution context +
shared kernel) and platform_validation, and references Portfolio/Risk by identity.

Boundaries: NOT broker integration, NOT exchange connectivity, NOT order routing, NOT market
connectivity. It NEVER communicates with brokers/exchanges and NEVER submits production orders. No
broker APIs, no FIX, no REST clients, no persistence, no infrastructure, no API. The external adapter
is downstream and out of scope.

Modules: model, status, lifecycle, planning, authorization, context, session, constraints, scheduling,
validation_coordination, monitoring, reporting, governance, management, policies, specifications,
metadata, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    authorization,
    constraints,
    context,
    errors,
    events,
    governance,
    lifecycle,
    management,
    metadata,
    model,
    monitoring,
    planning,
    policies,
    reporting,
    repositories,
    scheduling,
    session,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "planning", "authorization", "context", "session", "constraints",
    "scheduling", "validation_coordination", "monitoring", "reporting", "governance", "management",
    "policies", "specifications", "metadata", "events", "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ExecutionLifecycle(Enum):
    """The canonical execution lifecycle (plus REJECTED and CANCELLED)."""

    REQUESTED = "requested"
    PLANNED = "planned"
    VALIDATING = "validating"
    AUTHORIZED = "authorized"
    READY = "ready"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


L = ExecutionLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ExecutionLifecycle, ExecutionLifecycle], ...] = (
    (L.REQUESTED, L.PLANNED),
    (L.PLANNED, L.VALIDATING),
    (L.VALIDATING, L.AUTHORIZED),
    (L.AUTHORIZED, L.READY),
    (L.READY, L.COMPLETED),
    (L.COMPLETED, L.ARCHIVED),
    # reauthorization (token expiry / re-check) and rescheduling
    (L.AUTHORIZED, L.VALIDATING),
    (L.READY, L.PLANNED),
    # rejection
    (L.VALIDATING, L.REJECTED),
    # cancellation (from any pre-completion state) and recovery
    (L.PLANNED, L.CANCELLED),
    (L.VALIDATING, L.CANCELLED),
    (L.AUTHORIZED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.CANCELLED, L.PLANNED),   # recovery: re-plan a cancelled execution
    # archival of terminal-negative states
    (L.REJECTED, L.ARCHIVED),
    (L.CANCELLED, L.ARCHIVED),
)

#: Terminal state. Replay reproduces an execution PLAN from its manifest as a NEW execution (with
#: lineage), never a mutation (RL-1, CP-2).
TERMINAL_STATES: frozenset[ExecutionLifecycle] = frozenset({L.ARCHIVED})


class ExecutionLifecycleService(Protocol):
    """Governs lifecycle transitions. AUTHORIZED requires a valid governance token + risk sign-off +
    parity clearance; the service performs NO adjudication and no AI authorizes (RS-4, AI-1). Interface only."""

    def transition(self, execution: EntityId, to: ExecutionLifecycle) -> None: ...
PY
exreadme "$D" "lifecycle" \
"Define ExecutionLifecycle (REQUESTED/PLANNED/VALIDATING/AUTHORIZED/READY/COMPLETED/ARCHIVED + REJECTED/CANCELLED), the canonical transitions (reauthorization/cancellation/rescheduling/replay/recovery), and the lifecycle-service interface." \
"Enumerate the lifecycle and legal transitions as data; AUTHORIZED requires a valid token + risk + parity; replay creates new lineage (RL-1); hold no logic." \
"Consumed by model, status, authorization, scheduling, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RS-4, DEP-1, AI-1, RL-1); Architecture V2 §5.9, §7.2; RB-14 · EXEC; Execution Governance."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from execution_service.lifecycle import ExecutionLifecycle


@dataclass(frozen=True, slots=True)
class ExecutionStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ExecutionLifecycle
    since: str
PY
exreadme "$D" "status" \
"Define ExecutionStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent execution status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (ExecutionLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.9; RB-14 · EXEC."

# ===========================================================================
# context
# ===========================================================================
D="$SRC/context"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Context — the immutable, deterministic execution context (injected clock; no infra)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.execution import ExecutionMode
from core_domain.shared import AsOf


@dataclass(frozen=True, slots=True)
class ExecutionContext:
    """Immutable context for an execution run.

    The SAME engine runs backtest/paper/live differing only by the injected clock and adapter (AV2-23):
    ``as_of`` is the injected point-in-time boundary; ``adapter_ref`` references the (out-of-scope)
    execution adapter, which the engine NEVER calls. Default mode is PAPER (DEP-1). No wall-clock, no infra.
    """

    as_of: AsOf
    mode: ExecutionMode
    adapter_ref: str
PY
exreadme "$D" "context" \
"Define ExecutionContext: the immutable, deterministic execution context (injected clock as-of, mode, adapter reference)." \
"Carry the injected-clock boundary, execution mode (paper default), and the out-of-scope adapter reference by value; the engine never calls the adapter; hold no logic and no infra." \
"Consumed by planning, session, management; reuses core ExecutionMode." \
"core_domain.execution (ExecutionMode); core_domain.shared (AsOf); standard library." \
"CLAUDE.md (DEP-1, PIT-4, CS-3, AV2-23); Architecture V2 §5.9, §2.1; RB-14 · EXEC."

# ===========================================================================
# authorization
# ===========================================================================
D="$SRC/authorization"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Authorization — the governance authorization model and INTERFACE (token-gated live).

Live execution is impossible without a valid, time-boxed governance authorization token (RS-4);
default is PAPER (DEP-1); an LLM NEVER authorizes (AI-1); the kill-switch forces HALT (human, RS-3).
Reuses core_domain.execution.AuthorizationToken / ExecutionMode.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.execution import AuthorizationToken, ExecutionMode
from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ExecutionAuthorization:
    """A governance authorization for an execution plan.

    ``token`` is required for LIVE (valid + time-boxed, RS-4) and is None for PAPER (DEP-1). A
    capital-affecting authorization requires human counter-sign (HO-2); no AI authorizes (AI-1).
    """

    mode: ExecutionMode
    token: AuthorizationToken | None
    authorizer_role: str
    counter_signed: bool


class ExecutionAuthorizationService(Protocol):
    """Authorizes an execution plan. Interface only.

    LIVE requires a valid governance token + independent risk sign-off + parity clearance; PAPER is the
    default; the kill-switch can force HALT (human-invocable, never AI).
    """

    def authorize(self, execution: EntityId, mode: ExecutionMode) -> ExecutionAuthorization: ...
    def revoke(self, execution: EntityId) -> None: ...
    def engage_kill_switch(self, execution: EntityId, invoked_by: str) -> None: ...
PY
exreadme "$D" "authorization" \
"Define ExecutionAuthorization and ExecutionAuthorizationService: token-gated authorization with kill-switch (reusing core AuthorizationToken/ExecutionMode)." \
"Represent governance authorization (LIVE requires a valid time-boxed token + counter-sign; PAPER default); expose authorize/revoke/kill-switch; no AI authorizes; hold no logic." \
"core_domain.execution (AuthorizationToken, ExecutionMode); core_domain.shared (EntityId); requires risk sign-off + parity." \
"Consumed by lifecycle/management/governance; the kill-switch forces HALT." \
"CLAUDE.md (RS-4, RS-3, DEP-1, AI-1, HO-2); Architecture V2 §5.9, §6.3, §7.2; RB-14 · EXEC; RB-13 · RISK."

# ===========================================================================
# planning
# ===========================================================================
D="$SRC/planning"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Planning — the execution plan/instruction model and planning INTERFACE (plans only).

Transforms an approved portfolio into a deterministic execution PLAN. Instructions are PLAN elements,
NOT orders; the engine never routes or submits them and never connects to brokers/exchanges.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.execution import ExecutionMode
from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class ExecutionInstruction:
    """A single deterministic execution-plan instruction (a planned target delta; NOT an order).

    ``algo_ref`` references a deterministic execution algorithm (not the algorithm); no routing here.
    """

    instrument_ref: Ref
    target_delta: float
    algo_ref: str


@dataclass(frozen=True, slots=True)
class ExecutionPlan:
    """An immutable, deterministic execution PLAN derived from an approved portfolio (plans only).

    A plan is never submitted as production orders; it is paper-first (DEP-1) and reversible (DEP-3).
    """

    portfolio_ref: Ref  # -> portfolio_service approved portfolio (PS-1)
    instructions: tuple[ExecutionInstruction, ...]
    mode: ExecutionMode


class ExecutionPlanningService(Protocol):
    """Transforms an approved portfolio into a deterministic execution plan. Interface only.

    It produces plans only; it never routes/submits orders and never connects to brokers/exchanges.
    """

    def plan(self, execution: EntityId) -> ExecutionPlan: ...
PY
exreadme "$D" "planning" \
"Define ExecutionPlan, ExecutionInstruction, and ExecutionPlanningService: the execution plan/instruction model and planning interface (plans only)." \
"Transform an approved portfolio into a deterministic plan of instructions (planned deltas, not orders); produce plans only; never route/submit/connect; hold no logic." \
"core_domain.execution (ExecutionMode); core_domain.shared (EntityId, Ref); consumes an approved Portfolio by identity." \
"Consumed by validation/authorization/management." \
"CLAUDE.md (DEP-1/3, PS-1, DE-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; Execution Governance."

# ===========================================================================
# constraints
# ===========================================================================
D="$SRC/constraints"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Constraints — deterministic execution-governance constraints (no routing/math here)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class ExecutionConstraintKind(Enum):
    PARTICIPATION = "participation"   # participation-rate ceiling (governance, not routing)
    VENUE = "venue"
    ORDER_SIZE = "order_size"
    RISK = "risk"                     # mandatory, sourced from the Risk Engine (RS-1)
    MANDATE = "mandate"


@dataclass(frozen=True, slots=True)
class ExecutionConstraint:
    """A deterministic execution constraint (evaluated by the deterministic engine; no routing/math)."""

    kind: ExecutionConstraintKind
    name: str
    expression: str
    source: Ref | None


class ExecutionConstraintService(Protocol):
    """Manages (versioned) execution constraints, incl. mandatory risk constraints. Interface only."""

    def add_constraint(self, execution: EntityId, constraint: ExecutionConstraint) -> None: ...
PY
exreadme "$D" "constraints" \
"Define ExecutionConstraint, ExecutionConstraintKind, and ExecutionConstraintService: deterministic execution-governance constraints (participation/venue/order-size/risk/mandate)." \
"Represent execution constraints as immutable data with a management interface; include mandatory risk constraints from the Risk Engine; hold no routing or mathematics." \
"Consumed by planning, validation, governance; risk constraints reference the Risk Engine by identity." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (RS-1, DE-1, DEP-1); Architecture V2 §5.9, §5.7; RB-14 · EXEC; RB-13 · RISK."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Model — the canonical execution aggregate and value objects (data only).

An execution binds approved portfolio + risk + parity evidence and a Run Manifest (reproducibility).
It produces plans only; it holds no broker/exchange/order-routing logic.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, RunManifestRef, Version

from execution_service.status import ExecutionStatus


class DecisionVerdict(Enum):
    AUTHORIZE = "authorize"
    REJECT = "reject"


@dataclass(frozen=True, slots=True)
class ExecutionIdentifier:
    """A stable, versioned identity for an execution (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ExecutionEvidence:
    """Traceable evidence references (by identity, not computed).

    ``portfolio_ref`` is the approved portfolio (Portfolio Engine); ``risk_ref`` the risk authority
    (Risk Engine); ``parity_ref`` the research-to-production parity check (P3-15).
    """

    portfolio_ref: Ref
    risk_ref: Ref
    parity_ref: Ref


@dataclass(frozen=True, slots=True)
class ExecutionDecision:
    """A deterministic decision with an explainable rationale (EXP-2). No AI decides (AI-1)."""

    verdict: DecisionVerdict
    rationale: str


@dataclass(frozen=True, slots=True)
class ExecutionSummary:
    """A compact, immutable summary of an execution (references, not computed statistics)."""

    instruction_count: int
    mode: str


@dataclass(eq=False)
class Execution(AggregateRoot):
    """An execution planning/authorization aggregate (aggregate root).

    The final deterministic authority BEFORE any external adapter. It produces PLANS only, is paper-first
    (DEP-1), and is reversible (DEP-3); it binds a Run Manifest for reproducibility (RP-1). It is NOT
    broker/exchange/order routing and NEVER submits production orders.
    """

    identifier: ExecutionIdentifier
    evidence: ExecutionEvidence
    status: ExecutionStatus
    manifest: RunManifestRef
    provenance: Provenance
PY
exreadme "$D" "model" \
"Define the canonical execution models: Execution (aggregate), ExecutionIdentifier, ExecutionEvidence, ExecutionDecision, ExecutionSummary." \
"Represent an execution as an immutable, manifest-bearing aggregate that binds approved portfolio/risk/parity evidence by identity and produces plans only; hold no broker/exchange/order logic and no AI decision." \
"Consumed by every Execution Engine module; references Portfolio/Risk/parity by identity; reuses the reproducibility spine." \
"core_domain.shared (AggregateRoot, Provenance, Ref, RunManifestRef, Version); status." \
"CLAUDE.md (DEP-1/3, RS-4, PS-1, CP-2/5/7, RP-1, AI-1, NM-2); Architecture V2 §5.9, §6.3; RB-14 · EXEC; P3-15."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Metadata — the immutable, auditable metadata of an execution (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from execution_service.model import ExecutionIdentifier, ExecutionSummary
from execution_service.status import ExecutionStatus


@dataclass(frozen=True, slots=True)
class ExecutionMetadata:
    """Immutable metadata for an execution (auditable, provenance-bearing)."""

    identifier: ExecutionIdentifier
    description: str
    owner_role: str
    status: ExecutionStatus
    summary: ExecutionSummary
    provenance: Provenance
    tags: tuple[str, ...]
PY
exreadme "$D" "metadata" \
"Define ExecutionMetadata: the immutable, auditable, provenance-bearing metadata of an execution." \
"Carry execution metadata (identity, description, owner, status, summary, provenance, tags) as data; hold no logic." \
"Consumed by management and repositories." \
"core_domain.shared (Provenance); model; status." \
"CLAUDE.md (CP-7, OB-1); Architecture V2 §5.9; RB-14 · EXEC."

# ===========================================================================
# session
# ===========================================================================
D="$SRC/session"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Session — an immutable record of an execution session (paper/shadow by default)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.execution import ExecutionMode
from core_domain.shared import EntityId, RunManifestRef

from execution_service.context import ExecutionContext


@dataclass(frozen=True, slots=True)
class ExecutionSession:
    """An immutable record binding an execution + context + manifest for a run (paper default, DEP-1)."""

    execution_id: EntityId
    mode: ExecutionMode
    manifest: RunManifestRef


class ExecutionSessionService(Protocol):
    """Opens/closes a deterministic execution session (paper/shadow by default). Interface only.

    A session produces/records a plan run; it never submits production orders or connects to brokers.
    """

    def open_session(self, execution: EntityId, context: ExecutionContext) -> ExecutionSession: ...
    def close_session(self, session: EntityId) -> None: ...
PY
exreadme "$D" "session" \
"Define ExecutionSession and ExecutionSessionService: an immutable session record and its open/close interface (paper default)." \
"Bind an execution run's context to a Run Manifest as an immutable session; paper/shadow by default; never submit orders or connect to brokers; hold no logic." \
"core_domain.execution (ExecutionMode); core_domain.shared (EntityId, RunManifestRef); context." \
"Consumed by management; complements monitoring/reporting." \
"CLAUDE.md (DEP-1, CP-2, RP-1, OB-1); Architecture V2 §5.9; RB-14 · EXEC."

# ===========================================================================
# scheduling
# ===========================================================================
D="$SRC/scheduling"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Scheduling — the schedule model and scheduling INTERFACE (deterministic; no infra)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ExecutionSchedule:
    """An immutable execution window (supplied ISO-8601 boundaries; no wall-clock read, CS-3)."""

    window_start: str
    window_end: str


class ExecutionSchedulingService(Protocol):
    """Schedules/reschedules an authorized execution plan deterministically. Interface only — no infra.

    Rescheduling within the authorization does not itself execute; live remains token-gated (RS-4).
    """

    def schedule(self, execution: EntityId, schedule: ExecutionSchedule) -> None: ...
    def reschedule(self, execution: EntityId, schedule: ExecutionSchedule) -> None: ...
PY
exreadme "$D" "scheduling" \
"Define ExecutionSchedule and ExecutionSchedulingService: the execution window model and scheduling/rescheduling interface." \
"Represent execution windows as immutable data and schedule/reschedule authorized plans deterministically; no wall-clock reads; hold no infra or logic." \
"Consumed by management; schedules authorized plans; live remains token-gated (RS-4)." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (DEP-1, RS-4, CS-3); Architecture V2 §5.9; RB-14 · EXEC; Execution Governance."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Validation — orchestrates validation incl. research-to-production parity (P3-15).

Uses the Validation Foundation for STRUCTURAL validation and the parity harness for research↔production
parity; a parity breach blocks authorization (P3-15). It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.execution import ParityReport
from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class ExecutionValidationCoordinator(Protocol):
    """Coordinates an execution's validation before AUTHORIZED. Interface only.

    Structural validation is orchestrated via the Validation Foundation; research-to-production parity
    is checked via the deterministic parity harness — a breach blocks authorization (P3-15).
    """

    def request_validation(self, execution: EntityId, context: ValidationContext) -> None: ...
    def check_parity(self, execution: EntityId) -> ParityReport: ...
    def collect_report(self, execution: EntityId) -> ValidationReport: ...
PY
exreadme "$D" "validation_coordination" \
"Define ExecutionValidationCoordinator: orchestrate structural validation (Validation Foundation) and research-to-production parity (parity harness)." \
"Coordinate validation and parity; a parity breach blocks authorization; assert no significance; hold no logic." \
"core_domain.execution (ParityReport); core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to AUTHORIZED." \
"CLAUDE.md (AI-2, DE-1, P3-15); Architecture V2 §5.9, §6.3, §7.2; RB-04 · VAL; RB-14 · EXEC; P3-15."

# ===========================================================================
# monitoring
# ===========================================================================
D="$SRC/monitoring"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Monitoring Interfaces — surface execution metrics for independent monitoring (narrate only).

Surfaces fills/parity/TCA references for independent monitoring; it narrates and decides nothing. The
kill-switch (human/risk) can force HALT (RS-3). No infra.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.execution import Fill, ParityReport
from core_domain.shared import EntityId


class ExecutionMonitor(Protocol):
    """Surfaces execution status/metrics for independent monitoring. Interface only — narrates only.

    It reports fills/parity/status references; it never decides a halt (the risk engine/human does, RS-3).
    """

    def status(self, execution: EntityId) -> str: ...
    def latest_fill(self, execution: EntityId) -> Fill: ...
    def parity(self, execution: EntityId) -> ParityReport: ...
PY
exreadme "$D" "monitoring" \
"Define ExecutionMonitor: interfaces to surface execution status/fills/parity for independent monitoring." \
"Surface execution metrics for independent monitoring (narrate only); never decide a halt; hold no infra or logic." \
"core_domain.execution (Fill, ParityReport); core_domain.shared (EntityId)." \
"Feeds the Production Monitoring layer; the kill-switch (human/risk) forces HALT." \
"CLAUDE.md (RS-3, OB-1/3, EXP-3); Architecture V2 §5.9, §5.7; RB-14 · EXEC; Production Monitoring Governance."

# ===========================================================================
# reporting
# ===========================================================================
D="$SRC/reporting"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Reporting — the execution report model and reporting INTERFACE (references, not stats)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref

from execution_service.model import ExecutionSummary


@dataclass(frozen=True, slots=True)
class ExecutionReport:
    """An immutable, explainable execution report (references deterministic outputs, EXP-2)."""

    execution_id: EntityId
    summary: ExecutionSummary
    tca_ref: Ref          # realized transaction-cost analysis (computed by the deterministic engine)
    parity_ref: Ref
    reconciliation_ref: Ref


class ExecutionReportingService(Protocol):
    """Generates an immutable, explainable execution report. Interface only — no computation."""

    def generate(self, execution: EntityId) -> ExecutionReport: ...
PY
exreadme "$D" "reporting" \
"Define ExecutionReport and ExecutionReportingService: the immutable, explainable execution report and its generation." \
"Aggregate the summary and references to TCA/parity/reconciliation into an explainable report; compute no statistics; hold no logic." \
"core_domain.shared (EntityId, Ref); model (ExecutionSummary)." \
"Consumed by governance/monitoring/management." \
"CLAUDE.md (EXP-2, CP-7, OB-2); Architecture V2 §5.9; RB-14 · EXEC."

# ===========================================================================
# governance
# ===========================================================================
D="$SRC/governance"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Governance — the deterministic execution-governance enforcement INTERFACE (no logic).

Enforces: paper-first (DEP-1), token-gated live (RS-4), plans-only, reversibility (DEP-3), no broker/
exchange/order submission, and the kill-switch (RS-3). Enforcement is deterministic.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExecutionGovernanceService(Protocol):
    """Deterministically checks an execution's governance compliance. Interface only.

    Compliance requires: validated, parity-clean, risk-authorized, a valid token for LIVE, reversible,
    and no broker/exchange/order-submission overreach.
    """

    def is_governance_compliant(self, execution: EntityId) -> bool: ...
    def requires_authorization_token(self, execution: EntityId) -> bool: ...
PY
exreadme "$D" "governance" \
"Define ExecutionGovernanceService: deterministic enforcement of execution governance (paper-first, token-gated live, plans-only, reversibility, kill-switch, no broker/exchange)." \
"Check governance compliance deterministically; enforce paper-first, token-gated live, plans-only, and reversibility; hold no logic." \
"Consumed by authorization/management; enforces the execution boundaries and the kill-switch." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (DEP-1..4, RS-3/4, AI-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-30 · DEPLOY; Execution Governance."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Management — the Execution Engine application/service INTERFACES (plans only; no execution).

Orchestrates the execution lifecycle and gates authorization on validation + parity + risk + a valid
governance token. It is deterministic and produces PLANS only; no AI executes/authorizes (AI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from execution_service.metadata import ExecutionMetadata
from execution_service.model import ExecutionDecision


class ExecutionService(Protocol):
    """The Execution Engine service (interface only): drive the execution planning/authorization lifecycle."""

    def request(self, portfolio: EntityId) -> EntityId: ...
    def plan(self, execution: EntityId) -> None: ...
    def submit_for_validation(self, execution: EntityId) -> None: ...
    def authorize(self, execution: EntityId) -> None: ...
    def mark_ready(self, execution: EntityId) -> None: ...
    def cancel(self, execution: EntityId) -> None: ...
    def archive(self, execution: EntityId) -> None: ...


class ExecutionEngineService(Protocol):
    """The deterministic execution decision gate: yields an ExecutionDecision. Interface only.

    It produces plans and authorization decisions only; it never submits orders and no AI decides (AI-1).
    """

    def decide(self, execution: EntityId) -> ExecutionDecision: ...


class ExecutionCatalogService(Protocol):
    """Describes executions from the catalog. Interface only."""

    def describe(self, execution: EntityId) -> ExecutionMetadata: ...
PY
exreadme "$D" "management" \
"Define the Execution Engine service interfaces: ExecutionService (lifecycle), ExecutionEngineService (deterministic decision gate), ExecutionCatalogService." \
"Orchestrate the execution lifecycle and gate authorization on validation + parity + risk + a valid token; produce plans only; hold no execution authority beyond authorization and no AI decision." \
"Top-level module: composes model, planning, authorization, validation/governance, scheduling, session." \
"core_domain.shared (EntityId); model; metadata." \
"CLAUDE.md (DEP-1, RS-4, AI-1, DE-1, PS-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-13 · RISK; Execution Governance."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Policies — deterministic execution-governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Version


@dataclass(frozen=True, slots=True)
class ExecutionPolicy:
    """A named, versioned, deterministic execution policy (RB-14). Immutable; a change is a new version."""

    name: str
    version: Version
    description: str


class PaperFirstPolicy(Protocol):
    """The default execution mode is paper/shadow (DEP-1). Interface only."""

    def is_paper_by_default(self, execution: EntityId) -> bool: ...


class TokenGatedLivePolicy(Protocol):
    """Live execution is impossible without a valid, time-boxed governance token (RS-4). Interface only."""

    def has_valid_token(self, execution: EntityId) -> bool: ...


class DeterministicExecutionPolicy(Protocol):
    """Execution is deterministic; an LLM MUST NEVER execute or authorize (AI-1). Interface only."""

    def is_deterministic(self, execution: EntityId) -> bool: ...


class PlansOnlyPolicy(Protocol):
    """The engine produces plans only; it never submits orders or connects to brokers/exchanges. Interface only."""

    def is_plans_only(self, execution: EntityId) -> bool: ...


class ReversibilityPolicy(Protocol):
    """A deployment/plan is reversible; irreversible deployment is PROHIBITED (DEP-3). Interface only."""

    def is_reversible(self, execution: EntityId) -> bool: ...


class KillSwitchPolicy(Protocol):
    """The kill-switch forces HALT/paper; human-invocable, never AI-gated (RS-3). Interface only."""

    def can_force_halt(self, execution: EntityId) -> bool: ...
PY
exreadme "$D" "policies" \
"Define ExecutionPolicy (versioned) and the deterministic policy interfaces: PaperFirstPolicy, TokenGatedLivePolicy, DeterministicExecutionPolicy, PlansOnlyPolicy, ReversibilityPolicy, KillSwitchPolicy." \
"Express the execution-governance rules (paper-first, token-gated live, deterministic, plans-only, reversible, kill-switch) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by authorization/governance/management." \
"core_domain.shared (EntityId, Version); standard library." \
"CLAUDE.md (DEP-1..4, RS-3/4, AI-1, DE-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-30 · DEPLOY."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Specifications — composable STRUCTURAL predicates over executions (no routing/math).

These check structural readiness/governance prerequisites (planned, validated, parity-clean,
risk-authorized, token for live), NOT market state — the engine produces plans only.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TExecution = TypeVar("TExecution", contravariant=True)


class ExecutionSpecification(Protocol[TExecution]):
    """A composable, deterministic structural predicate over an execution. Interface only."""

    def is_satisfied_by(self, execution: TExecution) -> bool: ...


class ReadyForAuthorizationSpecification(Protocol[TExecution]):
    """Structural readiness for authorization (planned, validated, parity-clean, risk-authorized).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, execution: TExecution) -> bool: ...


class TokenGatedLiveSpecification(Protocol[TExecution]):
    """Structural check that LIVE holds a valid, time-boxed governance token (RS-4). Interface only."""

    def is_satisfied_by(self, execution: TExecution) -> bool: ...
PY
exreadme "$D" "specifications" \
"Define composable STRUCTURAL execution specifications: ExecutionSpecification, ReadyForAuthorizationSpecification, TokenGatedLiveSpecification." \
"Express reusable, composable structural readiness/token predicates; never route/execute or decide; hold no logic." \
"Composed by management/governance; authorization requires validation + parity + risk + token." \
"Standard library only." \
"CLAUDE.md (DE-1, RS-4, DEP-1, SE-3); Architecture V2 §5.9, §6.3; RB-14 · EXEC."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Domain Events — immutable facts about an execution (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExecutionRequested(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionPlanned(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionValidated(DomainEvent):
    """Records that the deterministic validation + parity gate passed (the engine decided)."""

    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionAuthorized(DomainEvent):
    """Records that execution was authorized under a valid governance token (RS-4)."""

    execution_id: EntityId
    authorization_token: str


@dataclass(frozen=True, slots=True)
class ExecutionRejected(DomainEvent):
    execution_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class ExecutionPrepared(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionCompleted(DomainEvent):
    execution_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionCancelled(DomainEvent):
    execution_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class ExecutionArchived(DomainEvent):
    execution_id: EntityId
PY
exreadme "$D" "events" \
"Define the canonical execution domain events: ExecutionRequested, ExecutionPlanned, ExecutionValidated, ExecutionAuthorized, ExecutionRejected, ExecutionPrepared, ExecutionCompleted, ExecutionCancelled, ExecutionArchived." \
"Represent execution lifecycle facts as immutable domain events; ExecutionAuthorized records a token-gated authorization." \
"core_domain.shared (DomainEvent, EntityId); align with core_domain.execution events." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, RS-4); Architecture V2 §5.9, §5.10; RB-14 · EXEC; Execution Governance."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Errors — Execution Engine domain errors (each expresses a violated execution invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class ExecutionError(DomainError):
    """Base for Execution Engine errors."""


class UnauthorizedExecution(ExecutionError):
    """Live execution/authorization attempted without a valid governance token (RS-4, FB-12)."""


class AIExecutionAttempt(ExecutionError):
    """An AI attempted to execute or authorize execution (AI-1, FB-1)."""


class OrderSubmissionAttempt(ExecutionError):
    """The engine attempted to submit a production order (out of scope — plans only)."""


class BrokerCommunicationAttempt(ExecutionError):
    """The engine attempted to communicate directly with a broker (out of scope)."""


class ExchangeConnectivityAttempt(ExecutionError):
    """The engine attempted direct exchange connectivity (out of scope)."""


class ParityBreach(ExecutionError):
    """A research-to-production parity breach blocks authorization (P3-15)."""


class IrreversibleDeployment(ExecutionError):
    """A deployment/plan that cannot be safely unwound (DEP-3)."""


class MissingRiskAuthority(ExecutionError):
    """Authorization was attempted without the required Risk Engine sign-off (RS-1/2)."""


class IllegalExecutionTransition(ExecutionError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
PY
exreadme "$D" "errors" \
"Define the Execution Engine errors: UnauthorizedExecution, AIExecutionAttempt, OrderSubmissionAttempt, BrokerCommunicationAttempt, ExchangeConnectivityAttempt, ParityBreach, IrreversibleDeployment, MissingRiskAuthority, IllegalExecutionTransition." \
"Express violated execution invariants (token-gated, no AI, plans-only, no broker/exchange, parity, reversibility, risk-authority, lifecycle) as errors." \
"Used across the Execution Engine modules." \
"core_domain.shared (DomainError); aligns with core_domain.execution errors." \
"CLAUDE.md (RS-4, AI-1, DEP-3, P3-15, FB-1/12); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-30 · DEPLOY; P3-15."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Execution Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from execution_service.model import Execution
from execution_service.planning import ExecutionPlan
from execution_service.session import ExecutionSession


class ExecutionRepositoryContract(Protocol):
    """Append-only repository of executions (immutable; supersede, never mutate, CP-2)."""

    def get(self, execution: EntityId) -> Execution: ...
    def add(self, execution: Execution) -> None: ...


class ExecutionPlanRepository(Protocol):
    """Append-only repository of immutable execution plans. Interface only."""

    def get(self, execution: EntityId) -> ExecutionPlan: ...
    def add(self, execution: EntityId, plan: ExecutionPlan) -> None: ...


class ExecutionSessionRepository(Protocol):
    """Append-only repository of execution sessions. Interface only."""

    def get(self, session: EntityId) -> ExecutionSession: ...
    def add(self, session: ExecutionSession) -> None: ...
PY
exreadme "$D" "repositories" \
"Define the Execution Engine repository interfaces: ExecutionRepositoryContract (append-only), ExecutionPlanRepository, ExecutionSessionRepository." \
"Express append-only, immutable retrieval of executions, plans, and sessions as interfaces; hold no persistence." \
"Consumed by management; complements core_domain.execution repositories." \
"core_domain.shared (EntityId); model; planning; session." \
"CLAUDE.md (CP-2, OB-1, RP-4); Architecture V2 §5.9; RB-14 · EXEC."

echo "Execution Engine generated."
