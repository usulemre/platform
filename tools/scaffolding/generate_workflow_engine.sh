#!/usr/bin/env bash
#
# generate_workflow_engine.sh — Phase 1.3 Workflow Engine Foundation generator.
#
# Governed by: CLAUDE.md; Architecture V2 §5.4 (Workflow Control Layer); Workflow Contracts (Tier-5);
#              Implementation Roadmap Phase 1; RB-20 · CODE; TDR (Python, workflow engine = Temporal
#              — this is the technology-independent ABSTRACTION layer, not the engine implementation).
#
# Emits the workflow-engine ABSTRACTIONS under packages/workflow-engine as `workflow_engine`:
# the canonical state machine, transitions, definition/instance/context/metadata, validation/
# approval/escalation/execution INTERFACES, workflow events, audit, policies, and results.
# Workflows ORCHESTRATE; they NEVER adjudicate (WCON-2, AV2-18). It contains NO workflow logic,
# NO orchestration, NO infrastructure, NO persistence, NO AI. Deterministic (no ambient time/RNG),
# framework-independent (stdlib + platform_contracts kernel only), immutable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/workflow-engine"
SRC="$PKG/src/workflow_engine"
cd "$ROOT"

# ---------------------------------------------------------------------------
# helper: per-module README (args must contain no $ or backticks)
# ---------------------------------------------------------------------------
wreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 dependencies 6 relationships 7 gov
  cat > "$1/README.md" <<EOF
# workflow-engine · $2

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose
$3

## Responsibilities
$4

## Dependencies
$5

## Relationships
$6

## Related Governance Documents
$7
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# workflow-engine — the technology-independent Workflow Control abstractions (Phase 1.3).
# Standard library + the platform contract kernel only. No orchestration/infrastructure deps.
[project]
name = "workflow-engine"
version = "0.1.0"
description = "Workflow Control Layer abstractions: state machine, transitions, gates, execution interfaces."
requires-python = ">=3.12"
dependencies = ["platform-contracts"]   # depends on the stable contract kernel only (IMP-10)

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/workflow_engine"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# workflow-engine — implemented in Phase 1.3

This package now contains the Workflow Engine Foundation (the `workflow_engine` package): the
canonical state machine, transitions, definition/instance/context, validation/approval/escalation/
execution interfaces, workflow events, audit, policies, and results. Orchestration logic, the
engine implementation (Temporal per the TDR), infrastructure, and persistence remain forbidden here.
MD

cat > "$SRC/__init__.py" <<'PY'
"""workflow_engine — the technology-independent Workflow Control Layer abstractions.

Defines HOW workflows are represented, transitioned, validated, approved, escalated, executed,
and audited — as pure abstractions realizing the Tier-5 Workflow Contracts. It orchestrates; it
NEVER adjudicates: every gate delegates to a deterministic engine or a human approver (WCON-2,
AV2-18). No orchestration engine, no infrastructure, no persistence, no AI, no ambient time/RNG.

Modules: state, transition, state_machine, definition, instance, context, metadata, validation,
approval, escalation, execution, events, audit, policies, results.
"""
from __future__ import annotations

from . import (
    approval,
    audit,
    context,
    definition,
    escalation,
    events,
    execution,
    instance,
    metadata,
    policies,
    results,
    state,
    state_machine,
    transition,
    validation,
)

__all__ = [
    "state", "transition", "state_machine", "definition", "instance", "context", "metadata",
    "validation", "approval", "escalation", "execution", "events", "audit", "policies", "results",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# state
# ===========================================================================
D="$SRC/state"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow State — the canonical lifecycle enum and state categories (data only, no logic)."""
from __future__ import annotations

from enum import Enum


class WorkflowState(Enum):
    """The canonical workflow lifecycle (realizes the Tier-5 universal state machine).

    Forward lifecycle: PROPOSED -> REGISTERED -> READY -> RUNNING -> VALIDATING -> APPROVED ->
    COMPLETED. Failure/holding states: FAILED, REJECTED, BLOCKED, ESCALATED, SUSPENDED, RETIRED.
    """

    PROPOSED = "proposed"
    REGISTERED = "registered"
    READY = "ready"
    RUNNING = "running"
    VALIDATING = "validating"
    APPROVED = "approved"
    COMPLETED = "completed"
    # failure / holding
    FAILED = "failed"
    REJECTED = "rejected"
    BLOCKED = "blocked"
    ESCALATED = "escalated"
    SUSPENDED = "suspended"
    RETIRED = "retired"


class StateCategory(Enum):
    """Coarse classification of a state (for policy/monitoring — no behavior here)."""

    ACTIVE = "active"      # PROPOSED, REGISTERED, READY, RUNNING, VALIDATING, APPROVED
    HOLDING = "holding"    # BLOCKED, SUSPENDED, ESCALATED (recoverable)
    TERMINAL = "terminal"  # COMPLETED, REJECTED, RETIRED, FAILED


#: Terminal states — no outbound transitions except governed retirement bookkeeping.
TERMINAL_STATES: frozenset[WorkflowState] = frozenset(
    {WorkflowState.COMPLETED, WorkflowState.REJECTED, WorkflowState.RETIRED, WorkflowState.FAILED}
)

#: Failure / non-success states (WFC-19 requires defined behavior for these).
FAILURE_STATES: frozenset[WorkflowState] = frozenset(
    {
        WorkflowState.FAILED,
        WorkflowState.REJECTED,
        WorkflowState.BLOCKED,
        WorkflowState.ESCALATED,
        WorkflowState.SUSPENDED,
        WorkflowState.RETIRED,
    }
)
PY
wreadme "$D" "state" \
"Define the canonical workflow lifecycle (WorkflowState) and state categories, plus the terminal and failure state sets." \
"Enumerate PROPOSED/REGISTERED/READY/RUNNING/VALIDATING/APPROVED/COMPLETED and the failure/holding states; declare terminal and failure sets. Data only." \
"Standard library (enum) only." \
"Consumed by transition, state_machine, instance, events, audit, policies, results." \
"CLAUDE.md (RL-1, WCON-1); Architecture V2 §5.4; Workflow Contracts (universal state machine, WFC-14/16/19)."

# ===========================================================================
# transition
# ===========================================================================
D="$SRC/transition"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Transition — declared transitions with pre/postconditions (data only, no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from workflow_engine.state import WorkflowState


class TransitionKind(Enum):
    """The nature of a transition (drives which gate/point applies)."""

    NORMAL = "normal"
    VALIDATION_GATE = "validation_gate"    # delegates to a deterministic validation engine
    APPROVAL_POINT = "approval_point"      # requires a human approval (HO-2)
    ROLLBACK_POINT = "rollback_point"      # saga compensation / rollback (WFC-19)
    ESCALATION = "escalation"              # escalation path (WFC-41)


@dataclass(frozen=True, slots=True)
class WorkflowTransition:
    """A single directed transition between two states."""

    source: WorkflowState
    target: WorkflowState
    kind: TransitionKind


@dataclass(frozen=True, slots=True)
class TransitionSpec:
    """A transition plus its named pre/postconditions (evaluated by an outer deterministic engine).

    The condition names are references; this layer holds NO evaluation logic (WCON-2).
    """

    transition: WorkflowTransition
    precondition: str
    postcondition: str
PY
wreadme "$D" "transition" \
"Define WorkflowTransition, TransitionKind (normal/validation-gate/approval-point/rollback/escalation), and TransitionSpec with named pre/postconditions." \
"Represent declared transitions as immutable data; hold no evaluation logic (conditions are evaluated by an outer deterministic engine, WCON-2)." \
"workflow_engine.state; standard library." \
"Consumed by state_machine, definition, execution, policies." \
"CLAUDE.md (WCON-1/2); Architecture V2 §5.4; Workflow Contracts (WFC-16 declared transitions with pre/postconditions)."

# ===========================================================================
# state_machine
# ===========================================================================
D="$SRC/state_machine"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""State Machine — the canonical allowed transitions, gates, points, and the StateMachine interface.

This is DATA (the legal transition set) plus an INTERFACE (StateMachine). It contains no evaluation
logic; a deterministic engine in an outer layer enforces it (WCON-2, WFC-16).
"""
from __future__ import annotations

from typing import Protocol

from workflow_engine.state import TERMINAL_STATES, WorkflowState
from workflow_engine.transition import TransitionKind, WorkflowTransition

S = WorkflowState


def _t(source: S, target: S, kind: TransitionKind) -> WorkflowTransition:
    return WorkflowTransition(source=source, target=target, kind=kind)


#: The canonical, allowed transition set (the universal state machine, WFC-14/16).
CANONICAL_TRANSITIONS: tuple[WorkflowTransition, ...] = (
    # forward lifecycle
    _t(S.PROPOSED, S.REGISTERED, TransitionKind.NORMAL),
    _t(S.REGISTERED, S.READY, TransitionKind.NORMAL),
    _t(S.READY, S.RUNNING, TransitionKind.NORMAL),
    _t(S.RUNNING, S.VALIDATING, TransitionKind.VALIDATION_GATE),
    _t(S.VALIDATING, S.APPROVED, TransitionKind.APPROVAL_POINT),
    _t(S.APPROVED, S.COMPLETED, TransitionKind.NORMAL),
    # holding / resume
    _t(S.RUNNING, S.BLOCKED, TransitionKind.NORMAL),
    _t(S.BLOCKED, S.RUNNING, TransitionKind.NORMAL),
    _t(S.RUNNING, S.SUSPENDED, TransitionKind.NORMAL),
    _t(S.SUSPENDED, S.RUNNING, TransitionKind.NORMAL),
    # failure
    _t(S.RUNNING, S.FAILED, TransitionKind.NORMAL),
    _t(S.VALIDATING, S.FAILED, TransitionKind.NORMAL),
    _t(S.VALIDATING, S.REJECTED, TransitionKind.NORMAL),
    # rollback (saga compensation, WFC-19)
    _t(S.RUNNING, S.READY, TransitionKind.ROLLBACK_POINT),
    _t(S.VALIDATING, S.READY, TransitionKind.ROLLBACK_POINT),
    # escalation (WFC-41)
    _t(S.RUNNING, S.ESCALATED, TransitionKind.ESCALATION),
    _t(S.VALIDATING, S.ESCALATED, TransitionKind.ESCALATION),
    _t(S.BLOCKED, S.ESCALATED, TransitionKind.ESCALATION),
    _t(S.ESCALATED, S.RUNNING, TransitionKind.NORMAL),
    _t(S.ESCALATED, S.REJECTED, TransitionKind.NORMAL),
    # governed retirement
    _t(S.FAILED, S.RETIRED, TransitionKind.NORMAL),
    _t(S.SUSPENDED, S.RETIRED, TransitionKind.NORMAL),
)

#: Representative FORBIDDEN transitions (stage-skips / research-to-production jumps, WFC-3/17).
#: Any (source, target) not in CANONICAL_TRANSITIONS is forbidden; these are called out explicitly.
FORBIDDEN_TRANSITIONS: tuple[tuple[WorkflowState, WorkflowState], ...] = (
    (S.PROPOSED, S.COMPLETED),   # skip everything
    (S.READY, S.APPROVED),       # skip running + validating
    (S.RUNNING, S.APPROVED),     # skip validation gate
    (S.RUNNING, S.COMPLETED),    # skip validation + approval
    (S.VALIDATING, S.COMPLETED),  # skip approval
)

#: Human-approval points (require recorded human approval, HO-2).
APPROVAL_POINTS: frozenset[tuple[WorkflowState, WorkflowState]] = frozenset(
    {(S.VALIDATING, S.APPROVED)}
)

#: Deterministic validation gates (delegate to a validation engine, WCON-2).
VALIDATION_GATES: frozenset[tuple[WorkflowState, WorkflowState]] = frozenset(
    {(S.RUNNING, S.VALIDATING)}
)

#: Rollback / compensation points (WFC-19).
ROLLBACK_POINTS: frozenset[tuple[WorkflowState, WorkflowState]] = frozenset(
    {(S.RUNNING, S.READY), (S.VALIDATING, S.READY)}
)


class StateMachine(Protocol):
    """Interface over the canonical machine. A deterministic engine implements it (no logic here).

    Rejecting an undeclared transition is fail-closed (WFC-16); the platform never lets a workflow
    skip a stage or bypass a gate (WFC-3/17, AV2-18).
    """

    def is_allowed(self, source: WorkflowState, target: WorkflowState) -> bool: ...
    def is_terminal(self, state: WorkflowState) -> bool: ...
    def requires_approval(self, source: WorkflowState, target: WorkflowState) -> bool: ...
    def is_validation_gate(self, source: WorkflowState, target: WorkflowState) -> bool: ...
    def transitions_from(self, state: WorkflowState) -> tuple[WorkflowTransition, ...]: ...


__all__ = [
    "CANONICAL_TRANSITIONS", "FORBIDDEN_TRANSITIONS", "APPROVAL_POINTS", "VALIDATION_GATES",
    "ROLLBACK_POINTS", "TERMINAL_STATES", "StateMachine",
]
PY
wreadme "$D" "state_machine" \
"Define the canonical allowed transitions, forbidden transitions (stage-skips), approval points, validation gates, rollback points, terminal states, and the StateMachine interface." \
"Declare the legal transition set as immutable data and expose a fail-closed StateMachine interface; hold no evaluation logic (a deterministic engine enforces it)." \
"workflow_engine.state, workflow_engine.transition; standard library." \
"Consumed by execution and policies; enforced by an outer deterministic engine." \
"CLAUDE.md (WCON-1/2, RG-3); Architecture V2 §5.4, §7; Workflow Contracts (WFC-3/16/17/41, AV2-18)."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Metadata — the descriptive, versioned metadata of a workflow (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion


@dataclass(frozen=True, slots=True)
class WorkflowMetadata:
    """Immutable metadata for a workflow definition.

    ``tier5_contract`` references the ratified Tier-5 Workflow Contract (e.g. ``"WFC-46"``); the
    contract remains authoritative for the rules (this is only a pointer).
    """

    name: str
    owner: str            # named accountable human role (WFC-8)
    tier5_contract: str   # reference to the Tier-5 Workflow Contract id
    version: SchemaVersion
    description: str
PY
wreadme "$D" "metadata" \
"Define WorkflowMetadata: name, accountable owner, the referenced Tier-5 contract id, version, and description." \
"Carry immutable, versioned descriptive metadata; reference (never restate) the governing Tier-5 Workflow Contract." \
"platform_contracts.common (SchemaVersion); standard library." \
"Consumed by definition." \
"CLAUDE.md (WCON-1, VER-1); Architecture V2 §5.4; Workflow Contracts (WFC-8 ownership, WFC-6 versioning)."

# ===========================================================================
# context
# ===========================================================================
D="$SRC/context"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Context — the immutable execution context passed to each step (deterministic)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import ActorRef, CorrelationId, Id


@dataclass(frozen=True, slots=True)
class WorkflowContext:
    """Immutable context for a workflow step.

    Time is not read here: ``as_of`` is a supplied ISO-8601 knowledge-time boundary for any
    point-in-time reads a step performs (PIT-1); the workflow engine itself performs no I/O.
    """

    instance_id: Id
    correlation_id: CorrelationId
    actor: ActorRef
    as_of: str | None
PY
wreadme "$D" "context" \
"Define WorkflowContext: the immutable, deterministic context (instance id, correlation, actor, as-of) passed to each workflow step." \
"Carry step context by value; supply the as-of boundary for point-in-time reads; read no ambient time." \
"platform_contracts.common (Id, CorrelationId, ActorRef); standard library." \
"Consumed by validation, approval, escalation, execution." \
"CLAUDE.md (PIT-1, CS-3, CP-7); Architecture V2 §5.4; Workflow Contracts (traceability)."

# ===========================================================================
# definition
# ===========================================================================
D="$SRC/definition"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Definition — the versioned, contract-bound process definition (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import VersionTag

from workflow_engine.metadata import WorkflowMetadata
from workflow_engine.transition import TransitionSpec


@dataclass(frozen=True, slots=True)
class WorkflowDefinition:
    """The immutable, versioned definition of a workflow: its declared transitions + metadata."""

    definition_id: VersionTag
    transitions: tuple[TransitionSpec, ...]
    metadata: WorkflowMetadata


@dataclass(frozen=True, slots=True)
class Workflow:
    """A named, versioned workflow (the contract-bound process). Immutable."""

    definition: WorkflowDefinition
PY
wreadme "$D" "definition" \
"Define Workflow and WorkflowDefinition: the immutable, versioned, contract-bound process definition (declared transitions + metadata)." \
"Represent a workflow's declared shape as immutable data; a material change creates a new version, never a mutation (WCON-1)." \
"platform_contracts.common (VersionTag); workflow_engine.transition, workflow_engine.metadata." \
"Consumed by execution; instantiated as WorkflowInstance." \
"CLAUDE.md (WCON-1, VER-1/2); Architecture V2 §5.4; Workflow Contracts (WFC-4/6/11)."

# ===========================================================================
# instance
# ===========================================================================
D="$SRC/instance"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Instance — an immutable snapshot of a running workflow (append-only history)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Id, VersionTag

from workflow_engine.state import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowInstance:
    """An immutable snapshot of a workflow instance at one point in its life.

    A transition produces a NEW snapshot; the run history is append-only (CP-2, WCON-1). Ownership
    is always explicit — an ownerless running instance is PROHIBITED (WFC-8).
    """

    instance_id: Id
    definition_id: VersionTag
    state: WorkflowState
    owner: str
PY
wreadme "$D" "instance" \
"Define WorkflowInstance: an immutable snapshot of a running workflow (id, definition, current state, explicit owner)." \
"Represent instance state as an append-only, immutable snapshot; never mutate — transitions create new snapshots." \
"platform_contracts.common (Id, VersionTag); workflow_engine.state." \
"Consumed by execution, audit, results." \
"CLAUDE.md (CP-2, WCON-1); Architecture V2 §5.4; Workflow Contracts (WFC-8 ownership, run history)."

# ===========================================================================
# validation
# ===========================================================================
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Validation — the validation-gate interface (delegates, never adjudicates)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from workflow_engine.context import WorkflowContext


@dataclass(frozen=True, slots=True)
class WorkflowValidation:
    """An immutable record of a validation-gate outcome (the deterministic engine produced it)."""

    gate: str
    passed: bool


class WorkflowValidationGate(Protocol):
    """A validation gate that DELEGATES to a deterministic engine (WCON-2, AV2-18).

    The workflow never computes significance/validity itself; it invokes the owning engine and
    routes on the result. Interface only.
    """

    def evaluate(self, context: WorkflowContext) -> WorkflowValidation: ...
PY
wreadme "$D" "validation" \
"Define WorkflowValidation (an immutable gate-outcome record) and the WorkflowValidationGate interface that delegates to a deterministic engine." \
"Represent validation as delegation: the workflow invokes the owning deterministic engine and routes on the outcome; it never adjudicates (WCON-2)." \
"workflow_engine.context; standard library." \
"Relates to the Validation domain / Quantitative Engine Layer (the actual adjudicator)." \
"CLAUDE.md (WCON-2, DE-1, VS-1); Architecture V2 §5.4, §5.6, §6.3; Workflow Contracts (AV2-18)."

# ===========================================================================
# approval
# ===========================================================================
D="$SRC/approval"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Approval — the human-approval interface at approval points (humans approve, not AI)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import ActorRef

from workflow_engine.context import WorkflowContext


class ApprovalDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class WorkflowApproval:
    """An immutable record of a human approval at an approval point (HO-2).

    ``counter_signed`` is required for capital-affecting approvals (HO-2, AV2-15).
    """

    approver: ActorRef
    decision: ApprovalDecision
    counter_signed: bool
    rationale: str


class WorkflowApprovalGate(Protocol):
    """Requests a human approval at an approval point; a human decides, never AI (HO-1). Interface only."""

    def request(self, context: WorkflowContext) -> WorkflowApproval: ...
PY
wreadme "$D" "approval" \
"Define WorkflowApproval (an immutable human-approval record with counter-sign and rationale) and the WorkflowApprovalGate interface." \
"Represent approval as a human decision recorded with identity and rationale; require counter-sign for capital-affecting approvals; AI never approves." \
"platform_contracts.common (ActorRef); workflow_engine.context; standard library." \
"Relates to the Governance domain / Human Governance Layer." \
"CLAUDE.md (HO-1..4, AV2-4); Architecture V2 §5.1, §5.4, §6.2; Workflow Contracts (WFC-13 approval requirements)."

# ===========================================================================
# escalation
# ===========================================================================
D="$SRC/escalation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Escalation — the escalation interface and path (halts on integrity/isolation/security)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from workflow_engine.context import WorkflowContext


@dataclass(frozen=True, slots=True)
class EscalationPath:
    """The defined escalation target and whether it halts progression (WFC-41)."""

    to_role: str
    halts: bool  # integrity/isolation/security escalations MUST halt and reach GRC (WFC-41)


class WorkflowEscalation(Protocol):
    """Escalates a workflow along its defined path; halts the affected progression. Interface only."""

    def escalate(self, context: WorkflowContext, path: EscalationPath, reason: str) -> None: ...
PY
wreadme "$D" "escalation" \
"Define EscalationPath and the WorkflowEscalation interface: escalate along a defined path, halting integrity/isolation/security cases." \
"Represent escalation as a governed, recorded routing that halts the affected progression; hold no routing logic." \
"workflow_engine.context; standard library." \
"Relates to the Governance domain (GRC) and Incident Response Governance." \
"CLAUDE.md (WCON-1, CP-7); Architecture V2 §5.4; Workflow Contracts (WFC-41 escalation)."

# ===========================================================================
# execution
# ===========================================================================
D="$SRC/execution"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Execution — the engine/runner/compensator INTERFACES (orchestrate, never adjudicate)."""
from __future__ import annotations

from typing import Protocol

from workflow_engine.context import WorkflowContext
from workflow_engine.definition import Workflow
from workflow_engine.instance import WorkflowInstance
from workflow_engine.state import WorkflowState


class WorkflowEngine(Protocol):
    """Orchestrates a workflow through declared transitions; it NEVER adjudicates (WCON-2, AV2-18).

    ``advance`` moves an instance to a declared target after that transition's gate/approval passes;
    an undeclared transition is rejected fail-closed (WFC-16). Interface only — no orchestration
    logic, no infrastructure, no persistence here (the engine implementation is Temporal, per TDR).
    """

    def start(self, workflow: Workflow, context: WorkflowContext) -> WorkflowInstance: ...
    def advance(
        self, instance: WorkflowInstance, target: WorkflowState, context: WorkflowContext
    ) -> WorkflowInstance: ...


class StageRunner(Protocol):
    """Runs the work of a single stage by invoking its owning engine/agent. Interface only."""

    def run(self, instance: WorkflowInstance, context: WorkflowContext) -> WorkflowInstance: ...


class Compensator(Protocol):
    """Saga compensation / rollback so partial failures leave consistent state (WFC-19, RE-1)."""

    def compensate(self, instance: WorkflowInstance, context: WorkflowContext) -> WorkflowInstance: ...


class WorkflowExecution(Protocol):
    """Marker for an execution binding (engine + runner + compensator). Interface only."""

    ...
PY
wreadme "$D" "execution" \
"Define the execution interfaces: WorkflowEngine (orchestrates transitions), StageRunner, Compensator (saga/rollback), and WorkflowExecution." \
"Represent execution as orchestration only: advance through declared transitions after gates pass; compensate on failure; NEVER adjudicate and NEVER run infrastructure/persistence here." \
"workflow_engine.definition, workflow_engine.instance, workflow_engine.state, workflow_engine.context." \
"Realized by the workflow engine (Temporal, per the TDR); coordinates deterministic engines, agents, and humans." \
"CLAUDE.md (WCON-1/2, RE-1, DE-1); Architecture V2 §5.4; Workflow Contracts (WFC-16/19, AV2-18); TDR §15."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Events — immutable lifecycle events (subclass the contract Event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class WorkflowCreated(Event):
    instance_id: Id
    definition: str


@dataclass(frozen=True, slots=True)
class WorkflowStarted(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowPaused(Event):
    """Instance moved to a holding state (BLOCKED/SUSPENDED)."""

    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowResumed(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowValidated(Event):
    instance_id: Id
    passed: bool


@dataclass(frozen=True, slots=True)
class WorkflowApproved(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowRejected(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowCompleted(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowFailed(Event):
    instance_id: Id
    reason: str


@dataclass(frozen=True, slots=True)
class WorkflowEscalated(Event):
    instance_id: Id
    reason: str
PY
wreadme "$D" "events" \
"Define the immutable workflow lifecycle events: WorkflowCreated, WorkflowStarted, WorkflowPaused, WorkflowResumed, WorkflowValidated, WorkflowApproved, WorkflowRejected, WorkflowCompleted, WorkflowFailed, WorkflowEscalated." \
"Represent lifecycle facts as immutable events carrying the contract envelope (identity, version, supplied time); records, not commands." \
"platform_contracts.common (Event, Id); standard library." \
"Published to the run ledger/audit; complement the contract-layer workflow events." \
"CLAUDE.md (CP-2/7, WCON-3); Architecture V2 §5.4, §5.10; Workflow Contracts (run history)."

# ===========================================================================
# audit
# ===========================================================================
D="$SRC/audit"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Audit — the immutable audit record and the append-only run-ledger interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ActorRef, Id

from workflow_engine.instance import WorkflowInstance
from workflow_engine.state import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowAuditRecord:
    """An immutable, hash-chained audit record of a workflow event (CP-7, SEC-4)."""

    instance_id: Id
    actor: ActorRef
    state: WorkflowState
    prev_hash: str
    entry_hash: str


class WorkflowAuditTrail(Protocol):
    """Append-only, tamper-evident audit trail. Interface only."""

    def append(self, record: WorkflowAuditRecord) -> None: ...


class RunLedger(Protocol):
    """Append-only run ledger recording every workflow run (WCON-3, OB-1). Interface only."""

    def record(self, instance: WorkflowInstance) -> None: ...
PY
wreadme "$D" "audit" \
"Define WorkflowAuditRecord (immutable, hash-chained) and the WorkflowAuditTrail and RunLedger interfaces." \
"Represent audit/run history as append-only, tamper-evident records; hold no storage logic." \
"platform_contracts.common (ActorRef, Id); workflow_engine.instance, workflow_engine.state." \
"Feeds the Observability/Audit spine and Governance." \
"CLAUDE.md (CP-7, SEC-4, OB-1, WCON-3); Architecture V2 §5.4, §5.10; Workflow Contracts (traceability)."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Policies — deterministic policy INTERFACES governing transitions (no logic here)."""
from __future__ import annotations

from typing import Protocol

from workflow_engine.state import WorkflowState


class WorkflowPolicy(Protocol):
    """Marker for a deterministic, versioned workflow policy."""

    ...


class StateMachinePolicy(Protocol):
    """Determines whether a transition is legal (WFC-16). Interface only; a deterministic engine implements it."""

    def is_transition_allowed(self, source: WorkflowState, target: WorkflowState) -> bool: ...


class StageSkipPolicy(Protocol):
    """Rejects stage-skipping / research-to-production jumps (WFC-3/17). Interface only."""

    def is_stage_skip(self, source: WorkflowState, target: WorkflowState) -> bool: ...


class GateOwnershipPolicy(Protocol):
    """Resolves which deterministic engine or human owns a given gate (gates delegate, WCON-2)."""

    def gate_owner(self, source: WorkflowState, target: WorkflowState) -> str: ...
PY
wreadme "$D" "policies" \
"Define the deterministic workflow policy interfaces: WorkflowPolicy, StateMachinePolicy, StageSkipPolicy, GateOwnershipPolicy." \
"Express the rules a deterministic engine enforces (legal transitions, no stage-skips, gate ownership) as interfaces; hold no logic." \
"workflow_engine.state; standard library." \
"Enforced by the deterministic workflow engine; consumed by execution." \
"CLAUDE.md (WCON-1/2, DE-1, RG-3); Architecture V2 §5.4; Workflow Contracts (WFC-3/16/17)."

# ===========================================================================
# results
# ===========================================================================
D="$SRC/results"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Results — the immutable result and error records of a workflow run (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Id

from workflow_engine.state import WorkflowState


class WorkflowResultStatus(Enum):
    SUCCESS = "success"
    FAILURE = "failure"


@dataclass(frozen=True, slots=True)
class WorkflowError:
    """An immutable error record for a failed workflow (a structured fact, not an exception)."""

    code: str
    message: str


@dataclass(frozen=True, slots=True)
class WorkflowResult:
    """The immutable outcome of a workflow run."""

    instance_id: Id
    status: WorkflowResultStatus
    final_state: WorkflowState
    error: WorkflowError | None
PY
wreadme "$D" "results" \
"Define WorkflowResult and WorkflowError: the immutable outcome and structured error of a workflow run." \
"Represent run outcomes as immutable data; hold no logic." \
"platform_contracts.common (Id); workflow_engine.state; standard library." \
"Consumed by callers and the run ledger/audit." \
"CLAUDE.md (CP-2/7); Architecture V2 §5.4; Workflow Contracts (run history)."

echo "Workflow Engine Foundation generated."
