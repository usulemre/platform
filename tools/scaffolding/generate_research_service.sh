#!/usr/bin/env bash
#
# generate_research_service.sh — Phase 2.1 Research Service generator.
#
# Governed by: CLAUDE.md (SM-1..5, RL-1/2, AD-2/3, CP-5, AI-2, EX-1, PIT-1); Architecture V2 §5.5
#              (Research Intelligence Layer), §6.1 (isolation barrier); Implementation Roadmap Phase 3
#              scaffolding; RB-02 · RMET; Experiment Tracking Governance; P2-07, P3-02.
#
# Emits the Research Service under services/research-service as `research_service`: the research
# initiative model + lifecycle, registration, metadata, ownership, classification, status,
# dependencies, policies, specifications, management/service interfaces, domain events, errors, and
# repository interfaces. It reuses core_domain (research context + shared kernel) and the platform
# contracts; it does NOT duplicate them.
#
# The Research Service PROPOSES and RECORDS; it NEVER adjudicates significance (that is the
# deterministic Validation engine, CP-5, AI-2) and it NEVER observes validation/OOS outcomes
# (the isolation barrier, AD-3, P2-07). It contains NO statistical algorithms, NO backtesting, NO AI,
# NO persistence, NO infrastructure, NO API, NO UI. Deterministic, technology-independent, immutable,
# auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/research-service"
SRC="$SVC/src/research_service"
cd "$ROOT"

rsreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# research-service · $2

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

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
# research-service — the Research Intelligence lifecycle service (Phase 2.1).
# Standard library + Phase-1 foundations only. No statistical/backtesting/AI/persistence/API deps.
[project]
name = "research-service"
version = "0.1.0"
description = "Research Service: research initiative model, lifecycle, registration, policies, events."
requires-python = ">=3.12"
dependencies = ["core-domain"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/research_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# research-service — Research Service implemented in Phase 2.1

This service now contains the Research Service (the `research_service` package): the research
initiative model, lifecycle, registration, metadata, ownership, classification, status,
dependencies, policies, specifications, management/service interfaces, domain events, errors, and
repository interfaces. Statistical algorithms, backtesting, AI, persistence, infrastructure, APIs,
and UI remain forbidden here. Adjudication belongs to the deterministic Validation engine.
MD

cat > "$SRC/__init__.py" <<'PY'
"""research_service — the Research Service: governs the quantitative research lifecycle.

Transforms research ideas into structured, traceable, reproducible research initiatives and
orchestrates their lifecycle across datasets, features, experiments, and validation workflows (by
identity/dependency, never by reaching into them). It reuses the Phase-1 foundations (core_domain
research context + shared kernel, platform_contracts).

Authority boundary (CP-5, AI-2, AD-3): the Research Service PROPOSES and RECORDS; it NEVER
adjudicates statistical significance or acceptance (that is the deterministic Validation engine),
and it NEVER observes validation/OOS outcomes (the isolation barrier, P2-07). Register-before-run
and pre-registration lock are enforced (SM-1/2); negative results are first-class (SM-4).

Boundaries: no statistical algorithms, no backtesting, no AI, no persistence, no infrastructure, no
API, no UI.

Modules: model, lifecycle, status, metadata, ownership, classification, dependencies, registration,
management, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    classification,
    dependencies,
    errors,
    events,
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
)

__all__ = [
    "model", "lifecycle", "status", "metadata", "ownership", "classification", "dependencies",
    "registration", "management", "policies", "specifications", "events", "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ResearchLifecycle(Enum):
    """The canonical research lifecycle (plus SUSPENDED for suspension/reopening)."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    DESIGNED = "designed"
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    VALIDATED = "validated"
    APPROVED = "approved"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"


L = ResearchLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ResearchLifecycle, ResearchLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.DESIGNED),
    (L.DESIGNED, L.ACTIVE),
    (L.ACTIVE, L.UNDER_REVIEW),
    (L.UNDER_REVIEW, L.VALIDATED),
    (L.VALIDATED, L.APPROVED),
    (L.APPROVED, L.ARCHIVED),
    # revisions
    (L.ACTIVE, L.DESIGNED),
    (L.UNDER_REVIEW, L.ACTIVE),
    (L.UNDER_REVIEW, L.DESIGNED),
    # suspension / reopening
    (L.DESIGNED, L.SUSPENDED),
    (L.ACTIVE, L.SUSPENDED),
    (L.UNDER_REVIEW, L.SUSPENDED),
    (L.SUSPENDED, L.ACTIVE),
    (L.SUSPENDED, L.ARCHIVED),
)

#: Terminal state. Reopening a KILLED/ARCHIVED effort creates a NEW versioned lineage (a branch),
#: never a mutation of history (RL-1) — hence ARCHIVED has no outbound transition here.
TERMINAL_STATES: frozenset[ResearchLifecycle] = frozenset({L.ARCHIVED})


class ResearchLifecycleService(Protocol):
    """Governs lifecycle transitions. A transition to VALIDATED/APPROVED requires the deterministic
    validation/scientific gate to have passed; the service performs NO adjudication. Interface only."""

    def transition(self, research: EntityId, to: ResearchLifecycle) -> None: ...
PY
rsreadme "$D" "lifecycle" \
"Define ResearchLifecycle (PROPOSED/REGISTERED/DESIGNED/ACTIVE/UNDER_REVIEW/VALIDATED/APPROVED/ARCHIVED + SUSPENDED), the canonical transitions (revisions/suspension/reopening), and the lifecycle-service interface." \
"Enumerate the lifecycle and its legal transitions as data; VALIDATED/APPROVED require a passed deterministic gate; reopening a killed effort creates new lineage (RL-1); hold no logic." \
"Consumed by model, status, registration, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (RL-1/2, SM-3, CP-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from research_service.lifecycle import ResearchLifecycle


@dataclass(frozen=True, slots=True)
class ResearchStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ResearchLifecycle
    since: str
PY
rsreadme "$D" "status" \
"Define ResearchStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent research status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (ResearchLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# ownership
# ===========================================================================
D="$SRC/ownership"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Ownership — the accountable owner value object and ownership-transfer interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ResearchOwner:
    """The accountable owner and steward roles for a research initiative (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


class ResearchOwnershipService(Protocol):
    """Transfers research ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, research: EntityId, to_role: str) -> None: ...
PY
rsreadme "$D" "ownership" \
"Define ResearchOwner and the ResearchOwnershipService interface: accountable ownership and its transfer." \
"Represent accountable ownership as data and its transfer as a recorded, interface-only operation; hold no logic." \
"Consumed by model, metadata, management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (CP-7, HO-1); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# classification
# ===========================================================================
D="$SRC/classification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Classification — the kind/domain classification of a research initiative (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ResearchKind(Enum):
    FACTOR = "factor"
    SIGNAL = "signal"
    RISK = "risk"
    EXECUTION = "execution"
    PORTFOLIO = "portfolio"
    META = "meta"  # meta-research (subject to the same rigor, CI-2)


class ResearchDomain(Enum):
    EQUITIES = "equities"
    RATES = "rates"
    CREDIT = "credit"
    FX = "fx"
    COMMODITIES = "commodities"
    CROSS_ASSET = "cross_asset"
    ASSET_AGNOSTIC = "asset_agnostic"  # the core never branches on asset class (CP-8)


@dataclass(frozen=True, slots=True)
class ResearchClassification:
    """The classification of a research initiative (drives ontology placement, KM-3)."""

    kind: ResearchKind
    domain: ResearchDomain
PY
rsreadme "$D" "classification" \
"Define ResearchClassification with ResearchKind and ResearchDomain enums (asset-agnostic option preserved)." \
"Classify research initiatives within the shared vocabulary; the core never branches on asset class; data only." \
"Consumed by model, metadata, specifications." \
"Standard library only." \
"CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Model — the canonical research initiative model (data only).

Reuses the core research domain (core_domain.research) for the falsifiable prediction and economic
rationale; adds the initiative-level aggregate that the Research Service governs.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.research import EconomicRationale, FalsifiablePrediction
from core_domain.shared import AggregateRoot, Provenance, Ref, Version

from research_service.classification import ResearchClassification
from research_service.ownership import ResearchOwner
from research_service.status import ResearchStatus


class ResearchPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True, slots=True)
class ResearchIdentifier:
    """A stable, versioned identity for a research initiative (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ResearchObjective:
    """The falsifiable objective and its economic rationale (AD-2, SM-1)."""

    statement: str
    rationale: EconomicRationale


@dataclass(frozen=True, slots=True)
class ResearchHypothesis:
    """The initiative's hypothesis; references the core domain Hypothesis by identity (SE-2)."""

    hypothesis_ref: Ref  # -> core_domain.research.Hypothesis
    prediction: FalsifiablePrediction


@dataclass(frozen=True, slots=True)
class ResearchEvidence:
    """Descriptive evidence supporting or refuting the hypothesis.

    Negative results are first-class and preserved (SM-4); this is a record, not an adjudication.
    """

    summary: str
    supports: bool


@dataclass(frozen=True, slots=True)
class ResearchReference:
    """A literature or prior-art reference (provenance for a proposal)."""

    citation: str
    uri: str | None


@dataclass(eq=False)
class Research(AggregateRoot):
    """A research initiative (aggregate root).

    It proposes and records; it does NOT adjudicate significance/acceptance (CP-5) and it does NOT
    observe validation/OOS outcomes (the isolation barrier, AD-3, P2-07).
    """

    identifier: ResearchIdentifier
    objective: ResearchObjective
    hypothesis: ResearchHypothesis | None
    classification: ResearchClassification
    owner: ResearchOwner
    priority: ResearchPriority
    status: ResearchStatus
    provenance: Provenance
PY
rsreadme "$D" "model" \
"Define the canonical research models: Research (aggregate), ResearchIdentifier, ResearchObjective, ResearchHypothesis, ResearchEvidence, ResearchReference, ResearchPriority." \
"Represent a research initiative as an immutable, provenance-bearing aggregate that proposes and records; reuse the core research domain for prediction/rationale; hold no logic and no adjudication." \
"Consumed by every other Research Service module; references core_domain.research.Hypothesis by identity." \
"core_domain.research (EconomicRationale, FalsifiablePrediction); core_domain.shared (AggregateRoot, Provenance, Ref, Version); classification; ownership; status." \
"CLAUDE.md (SM-1/4, AD-2/3, CP-2/5/7, RL-1, NM-2); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Metadata — the immutable, auditable metadata of a research initiative (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from research_service.classification import ResearchClassification
from research_service.model import ResearchIdentifier, ResearchPriority
from research_service.ownership import ResearchOwner
from research_service.status import ResearchStatus


@dataclass(frozen=True, slots=True)
class ResearchMetadata:
    """Immutable metadata for a research initiative (auditable, provenance-bearing)."""

    identifier: ResearchIdentifier
    description: str
    classification: ResearchClassification
    owner: ResearchOwner
    status: ResearchStatus
    priority: ResearchPriority
    provenance: Provenance
    tags: tuple[str, ...]
PY
rsreadme "$D" "metadata" \
"Define ResearchMetadata: the immutable, auditable, provenance-bearing metadata of a research initiative." \
"Carry research metadata (identity, description, classification, owner, status, priority, provenance, tags) as data; hold no logic." \
"Consumed by management and repositories." \
"core_domain.shared (Provenance); model; classification; ownership; status." \
"CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-02 · RMET."

# ===========================================================================
# dependencies
# ===========================================================================
D="$SRC/dependencies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Dependencies — links from a research initiative to datasets/features/experiments (by id).

These are the connective tissue of the orchestration layer. All links are by identity/reference
(SE-2); no research module reaches into another context's internals, and none creates a channel that
would let generation observe validation/OOS outcomes (AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import Ref


class DependencyKind(Enum):
    DATASET = "dataset"
    FEATURE = "feature"
    EXPERIMENT = "experiment"
    VALIDATION = "validation"      # a reference only; outcomes are not observable by generation
    PRIOR_RESEARCH = "prior_research"


@dataclass(frozen=True, slots=True)
class ResearchDependency:
    """A declared dependency of a research initiative on another artifact, by identity."""

    kind: DependencyKind
    target: Ref
PY
rsreadme "$D" "dependencies" \
"Define ResearchDependency and DependencyKind: declared links from a research initiative to datasets, features, experiments, validation, and prior research." \
"Represent cross-context dependencies by identity only; declare all dependencies explicitly; never create an isolation-barrier-breaching channel; hold no logic." \
"Consumed by management; connects to Dataset/Feature/Experiment/Validation by reference." \
"core_domain.shared (Ref); standard library." \
"CLAUDE.md (SE-2, AC-1/3, AD-3); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07."

# ===========================================================================
# registration
# ===========================================================================
D="$SRC/registration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Registration — register-before-run and pre-registration INTERFACES (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.research import PreRegistration
from core_domain.shared import EntityId

from research_service.model import Research


class ResearchRegistrationService(Protocol):
    """Registers a research initiative before any work runs (register-before-run, SM-1). Interface only."""

    def register(self, research: Research) -> None: ...


class PreRegistrationService(Protocol):
    """Freezes the hypothesis's falsifiable prediction and success criteria before evaluation.

    Pre-registration is a one-way lock; post-hoc alteration is p-hacking and PROHIBITED (SM-2, FB-8).
    Interface only — delegates to core_domain.research.PreRegistrationService.
    """

    def pre_register(self, research: EntityId, registration: PreRegistration) -> None: ...
PY
rsreadme "$D" "registration" \
"Define ResearchRegistrationService and PreRegistrationService: register-before-run and the one-way pre-registration lock." \
"Express register-before-run and pre-registration (frozen success criteria before evaluation) as interfaces; hold no logic." \
"Consumed by management; delegates to core_domain.research.PreRegistrationService." \
"core_domain.research (PreRegistration); core_domain.shared (EntityId); model." \
"CLAUDE.md (SM-1/2, FB-8, EX-1); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P3-02."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Management — the Research Service application/orchestration INTERFACES (no adjudication).

These interfaces orchestrate the research lifecycle and connect datasets/features/experiments/
validation by dependency. They PROPOSE and RECORD; they NEVER adjudicate significance and NEVER
surface validation/OOS outcomes to generation (CP-5, AD-3, P2-07). No statistical logic, no AI.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from research_service.dependencies import ResearchDependency
from research_service.metadata import ResearchMetadata
from research_service.model import Research


class ResearchService(Protocol):
    """The Research Service (interface only): drive the lifecycle of a research initiative."""

    def create(self, research: Research) -> None: ...
    def start(self, research: EntityId) -> None: ...
    def update(self, research: EntityId) -> None: ...
    def submit_for_review(self, research: EntityId) -> None: ...
    def archive(self, research: EntityId) -> None: ...


class ResearchManagementService(Protocol):
    """Orchestrates dependencies and gate routing across datasets/features/experiments/validation.

    It records the outcome of the deterministic validation/scientific gate; it never computes or
    asserts it. Interface only.
    """

    def declare_dependency(self, research: EntityId, dependency: ResearchDependency) -> None: ...
    def record_validation_outcome(self, research: EntityId, passed: bool) -> None: ...


class ResearchCatalogService(Protocol):
    """Describes research initiatives from the catalog. Interface only."""

    def describe(self, research: EntityId) -> ResearchMetadata: ...
PY
rsreadme "$D" "management" \
"Define the Research Service interfaces: ResearchService (lifecycle), ResearchManagementService (dependency/gate orchestration), ResearchCatalogService." \
"Orchestrate the research lifecycle and connect datasets/features/experiments/validation by dependency; record (never compute) deterministic gate outcomes; hold no adjudication, statistics, or AI." \
"Top-level module: composes model, dependencies, metadata, lifecycle, registration; routes to deterministic gates." \
"core_domain.shared (EntityId); model; dependencies; metadata." \
"CLAUDE.md (CP-5, AI-2, AD-3, SM-3, DE-1); Architecture V2 §5.5, §6.1, §6.3; RB-02 · RMET; P2-07/09."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Policies — deterministic policy INTERFACES governing research (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ResearchPolicy(Protocol):
    """Marker for a deterministic, versioned research policy."""

    ...


class RegisterBeforeRunPolicy(Protocol):
    """No research runs before it is registered (SM-1, EX-1). Interface only."""

    def is_registered(self, research: EntityId) -> bool: ...


class PreRegistrationLockPolicy(Protocol):
    """Success criteria are frozen before evaluation; post-hoc change is PROHIBITED (SM-2). Interface only."""

    def is_locked(self, research: EntityId) -> bool: ...


class IsolationBarrierPolicy(Protocol):
    """Generation MUST NOT observe validation/OOS outcomes (AD-3, P2-07). Interface only."""

    def may_observe(self, research: EntityId, resource: str) -> bool: ...


class NegativeResultsPolicy(Protocol):
    """Negative results are first-class and preserved (SM-4). Interface only."""

    def must_preserve(self) -> bool: ...
PY
rsreadme "$D" "policies" \
"Define the deterministic research policy interfaces: ResearchPolicy, RegisterBeforeRunPolicy, PreRegistrationLockPolicy, IsolationBarrierPolicy, NegativeResultsPolicy." \
"Express the scientific-integrity rules (register-before-run, pre-registration lock, isolation barrier, negative-results preservation) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (SM-1/2/4, AD-3, CP-5, DE-1); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Specifications — composable STRUCTURAL predicates over research (no logic, no statistics).

These check structural readiness (e.g. has a pre-registered hypothesis, declared dependencies), NOT
statistical significance or promotion — those are the deterministic Validation engine's decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TResearch = TypeVar("TResearch", contravariant=True)


class ResearchSpecification(Protocol[TResearch]):
    """A composable, deterministic structural predicate over a research initiative. Interface only."""

    def is_satisfied_by(self, research: TResearch) -> bool: ...


class ReadyForReviewSpecification(Protocol[TResearch]):
    """Structural readiness to submit for review (registered, pre-registered, dependencies declared).

    STRUCTURAL only — it does not judge whether results are significant. Interface only.
    """

    def is_satisfied_by(self, research: TResearch) -> bool: ...


class PromotionPrerequisiteSpecification(Protocol[TResearch]):
    """Structural prerequisites for promotion (has evidence, economic rationale, isolation-compliant).

    The promotion DECISION is the deterministic scientific gate's (P2-09), never this specification.
    Interface only.
    """

    def is_satisfied_by(self, research: TResearch) -> bool: ...
PY
rsreadme "$D" "specifications" \
"Define composable STRUCTURAL research specifications: ResearchSpecification, ReadyForReviewSpecification, PromotionPrerequisiteSpecification." \
"Express reusable, composable structural readiness predicates; never judge statistical significance or decide promotion; hold no logic." \
"Composed by management; the promotion decision is the deterministic scientific gate's." \
"Standard library only." \
"CLAUDE.md (DE-1, AI-2, RG-1, SE-3); Architecture V2 §5.5, §5.6, §6.3; RB-02 · RMET; P2-09."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Domain Events — immutable facts about a research initiative (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ResearchCreated(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchRegistered(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchStarted(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchUpdated(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchSubmittedForReview(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchValidated(DomainEvent):
    """Records that the deterministic validation/scientific gate passed (the engine decided, not us)."""

    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchApproved(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchArchived(DomainEvent):
    research_id: EntityId
PY
rsreadme "$D" "events" \
"Define the canonical research domain events: ResearchCreated, ResearchRegistered, ResearchStarted, ResearchUpdated, ResearchSubmittedForReview, ResearchValidated, ResearchApproved, ResearchArchived." \
"Represent research lifecycle facts as immutable domain events carrying the domain event envelope; ResearchValidated records a deterministic-engine outcome, it does not assert it." \
"Published to the bus/audit; align with core_domain.research events." \
"core_domain.shared (DomainEvent, EntityId)." \
"CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.5, §5.10; RB-02 · RMET."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Errors — Research Service domain errors (each expresses a violated research invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class ResearchError(DomainError):
    """Base for Research Service errors."""


class ResearchNotRegistered(ResearchError):
    """Research work was attempted before registration (register-before-run, SM-1)."""


class PreRegistrationAltered(ResearchError):
    """Success criteria were altered after pre-registration (p-hacking, SM-2, FB-8)."""


class ResearchSelfAdjudication(ResearchError):
    """Research attempted to adjudicate its own significance/acceptance (separation of powers, CP-5)."""


class IsolationBarrierBreach(ResearchError):
    """Generation observed validation/OOS outcomes (AD-3, P2-07)."""


class NegativeResultDiscarded(ResearchError):
    """A negative result was discarded rather than preserved (SM-4)."""


class IllegalResearchTransition(ResearchError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(ResearchError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
PY
rsreadme "$D" "errors" \
"Define the Research Service errors: ResearchNotRegistered, PreRegistrationAltered, ResearchSelfAdjudication, IsolationBarrierBreach, NegativeResultDiscarded, IllegalResearchTransition, UndeclaredDependency." \
"Express violated research invariants (register-before-run, pre-registration lock, separation of powers, isolation barrier, negative-results, lifecycle, declared dependencies) as errors." \
"Used across the Research Service modules." \
"core_domain.shared (DomainError)." \
"CLAUDE.md (SM-1/2/4, AD-3, CP-5, FB-8, SE-2); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Research Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from research_service.dependencies import ResearchDependency
from research_service.model import Research


class ResearchRepositoryContract(Protocol):
    """Append-only repository of research initiatives (immutable; supersede, never mutate, CP-2).

    A backward transition (reopening a killed effort) creates a NEW versioned lineage, never a
    mutation of history (RL-1). No persistence here.
    """

    def get(self, research: EntityId) -> Research: ...
    def add(self, research: Research) -> None: ...


class ResearchDependencyRepository(Protocol):
    """Retrieval of a research initiative's declared dependencies. Interface only."""

    def dependencies_of(self, research: EntityId) -> tuple[ResearchDependency, ...]: ...
PY
rsreadme "$D" "repositories" \
"Define the Research Service repository interfaces: ResearchRepositoryContract (append-only), ResearchDependencyRepository." \
"Express append-only, immutable retrieval of research initiatives and their dependencies as interfaces; backward transitions create new lineage; hold no persistence." \
"Consumed by management; complements core_domain.research repositories." \
"core_domain.shared (EntityId); model; dependencies." \
"CLAUDE.md (CP-2, RL-1, SM-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance."

echo "Research Service generated."
