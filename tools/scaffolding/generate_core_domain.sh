#!/usr/bin/env bash
#
# generate_core_domain.sh — Phase 1.1 Core Domain Foundation generator.
#
# Governed by: CLAUDE.md; Architecture V2 §5 (shared kernel); Implementation Roadmap Phase 1;
#              RB-20 · CODE; Technology Decision Record (Python, stdlib-only, framework-free).
#
# Emits the PURE domain layer under packages/core-domain: boundaries, entities, value objects,
# aggregates, repository interfaces, domain service interfaces, domain events, and domain errors.
# It contains NO business logic, NO persistence, NO API, NO infrastructure, NO AI. Interfaces are
# Protocols; methods are placeholders. It is technology/framework-independent (stdlib only),
# deterministic (no ambient time/RNG), and idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/core-domain"
SRC="$PKG/src/core_domain"
cd "$ROOT"

# ---------------------------------------------------------------------------
# helper: per-domain README (fields passed as args; no $ or backticks in values)
# ---------------------------------------------------------------------------
dreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 boundaries 6 relationships 7 interfaces 8 forbidden 9 gov
  cat > "$1/README.md" <<EOF
# core-domain · $2 domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose
$3

## Responsibilities
$4

## Boundaries
$5

## Relationships
$6 Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces
$7

## Forbidden Responsibilities
$8

## Dependencies
core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents
$9
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# core-domain — the asset-agnostic canonical domain model (Phase 1.1).
# Pure domain: standard library only. No third-party runtime dependencies (framework independence).
[project]
name = "core-domain"
version = "0.1.0"
description = "Canonical, technology-independent domain model shared across the platform."
requires-python = ">=3.12"
dependencies = []            # intentionally empty — the domain depends on nothing (CP-8, SE-2)

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/core_domain"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# core-domain — implemented in Phase 1.1

This package now contains the Core Domain Foundation (pure domain model). See README.md and the
per-domain modules under `src/core_domain/`. Business logic is still forbidden here; it lives in the
services and deterministic engines that consume this model.
MD

cat > "$SRC/__init__.py" <<'PY'
"""core_domain — the platform's canonical, asset-agnostic domain model.

This package defines the *shared language* used by every service, workflow, AI agent, and
deterministic engine: bounded-context modules, entities, value objects, aggregates, repository
and domain-service *interfaces*, domain events, and domain errors.

Purity contract (enforced by review, RB-20 · CODE):
    * standard library only — no third-party, framework, infrastructure, UI, persistence, or AI;
    * no ambient non-determinism — time and randomness are injected, never read here (CS-3, PIT-4);
    * no asset-class branching — the core is asset-agnostic (CP-8);
    * consequential artifacts are immutable and versioned (CP-2); this layer models that, it does
      not persist it.

Each bounded-context module depends only on ``core_domain.shared``; cross-context references are by
identity (``shared.Ref`` or typed ids), never by importing another context's aggregate (SE-2).
"""

__all__ = [
    "shared",
    "research", "dataset", "experiment", "feature", "signal", "strategy",
    "portfolio", "risk", "validation", "execution", "workflow", "agent", "governance",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# SHARED KERNEL
# ===========================================================================
mkdir -p "$SRC/shared"

cat > "$SRC/shared/identifiers.py" <<'PY'
"""Shared identity value objects (NM-2: a name denotes exactly one immutable artifact version)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class EntityId:
    """Opaque, stable identity of an entity within its bounded context."""

    value: str


@dataclass(frozen=True, slots=True)
class Version:
    """Semantic version; a breaking change bumps ``major`` (VER-1)."""

    major: int
    minor: int
    patch: int


@dataclass(frozen=True, slots=True)
class VersionedId:
    """A name + version that immutably denotes one artifact version (NM-2, VER-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ContentAddress:
    """Content-addressed identity (hash) of an immutable artifact (CP-2, P1-02)."""

    algorithm: str
    digest: str


@dataclass(frozen=True, slots=True)
class Ref:
    """A cross-context reference by identity only (SE-2).

    ``target`` names the referenced aggregate (e.g. ``"strategy.Strategy"``) for documentation;
    resolution happens in an outer layer, never inside the domain.
    """

    id: str
    target: str
PY

cat > "$SRC/shared/time.py" <<'PY'
"""Time value objects. Time is always *supplied* (injected clock), never read here (CS-3, PIT-4)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Timestamp:
    """An instant as an ISO-8601 string (library-free); provided by an injected clock."""

    iso8601: str


@dataclass(frozen=True, slots=True)
class EventTime:
    """When something happened in the world (bitemporal)."""

    at: Timestamp


@dataclass(frozen=True, slots=True)
class KnowledgeTime:
    """When something became known to the platform (bitemporal)."""

    at: Timestamp


@dataclass(frozen=True, slots=True)
class BitemporalStamp:
    """event_time + knowledge_time, enabling correct restatement handling (DI-3)."""

    event_time: EventTime
    knowledge_time: KnowledgeTime


@dataclass(frozen=True, slots=True)
class AsOf:
    """A point-in-time read boundary; a historical read without one is PROHIBITED (PIT-1)."""

    knowledge_time: KnowledgeTime
PY

cat > "$SRC/shared/authority.py" <<'PY'
"""The authority spine as domain values: AI proposes/narrates, engines decide, humans approve."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Authority(Enum):
    """Authority ceiling of an actor (Architecture V2 §4; AI never holds DECIDE/APPROVE)."""

    PROPOSE = "propose"
    NARRATE = "narrate"
    DECIDE = "decide"
    APPROVE = "approve"


class ActorKind(Enum):
    HUMAN = "human"
    DETERMINISTIC_ENGINE = "deterministic_engine"
    AI_AGENT = "ai_agent"


@dataclass(frozen=True, slots=True)
class ActorRef:
    """Who performed an action and the authority they hold (CP-5, HO-1)."""

    id: str
    kind: ActorKind
    authority: Authority
PY

cat > "$SRC/shared/provenance.py" <<'PY'
"""Provenance value objects — every consequential artifact carries its lineage (CP-6, DP-3)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .authority import ActorRef


@dataclass(frozen=True, slots=True)
class RunManifestRef:
    """Reference to the Run Manifest that reproduces a deterministic artifact (P1-02, RP-1)."""

    id: str


@dataclass(frozen=True, slots=True)
class LineageRef:
    """Reference into the lineage graph back to raw sources (CP-6, DP-1)."""

    id: str


class ArtifactClass(Enum):
    DETERMINISTIC = "deterministic"
    STOCHASTIC = "stochastic"  # any lineage that includes an LLM is reproducible only to output (RP-3)


@dataclass(frozen=True, slots=True)
class Provenance:
    """Mandatory lineage envelope for a consequential artifact (CP-6)."""

    produced_by: ActorRef
    artifact_class: ArtifactClass
    lineage: LineageRef
    run_manifest: RunManifestRef | None
PY

cat > "$SRC/shared/value_object.py" <<'PY'
"""Marker base for immutable, equality-by-value domain values."""
from __future__ import annotations


class ValueObject:
    """Concrete value objects are frozen dataclasses; they hold no I/O and no business logic."""

    __slots__ = ()
PY

cat > "$SRC/shared/event.py" <<'PY'
"""Domain event base. Events are immutable, past-tense facts — records, never commands."""
from __future__ import annotations

from dataclasses import dataclass

from .identifiers import EntityId
from .time import KnowledgeTime


@dataclass(frozen=True, slots=True)
class DomainEventMeta:
    """Envelope metadata carried by every domain event (CP-7 auditability)."""

    event_id: EntityId
    aggregate_id: EntityId
    occurred_at: KnowledgeTime  # supplied by an injected clock, never now() (CS-3)


@dataclass(frozen=True, slots=True)
class DomainEvent:
    """Base for all domain events. Subclasses add immutable, value-typed fields only."""

    meta: DomainEventMeta
PY

cat > "$SRC/shared/entity.py" <<'PY'
"""Entity and AggregateRoot bases. Invariants are enforced by outer deterministic engines (DE-1)."""
from __future__ import annotations

from dataclasses import dataclass

from .event import DomainEvent
from .identifiers import EntityId


@dataclass(eq=False)
class Entity:
    """An object with a stable identity across state changes."""

    id: EntityId


@dataclass(eq=False)
class AggregateRoot(Entity):
    """Consistency boundary; the only object a repository loads/stores (immutably, CP-2)."""

    def record_event(self, event: DomainEvent) -> None:
        """Register a domain event for later publication by the application layer. Placeholder."""
        raise NotImplementedError

    def pull_events(self) -> list[DomainEvent]:
        """Return and clear pending domain events. Placeholder — implemented in an outer layer."""
        raise NotImplementedError
PY

cat > "$SRC/shared/errors.py" <<'PY'
"""Canonical shared domain errors — each expresses a violated constitutional invariant."""
from __future__ import annotations


class DomainError(Exception):
    """Base for all domain errors. Domain errors express violated invariants, not I/O faults."""


class InvariantViolation(DomainError):
    """A domain aggregate invariant was violated."""


class NotFound(DomainError):
    """A referenced aggregate does not exist."""


class Conflict(DomainError):
    """A concurrency or uniqueness conflict."""


class ImmutabilityViolation(DomainError):
    """An attempt to mutate a consequential, versioned artifact (CP-2)."""


class AuthorityViolation(DomainError):
    """An actor attempted an action beyond its authority ceiling (AI-1..4, HO-1)."""


class SeparationOfPowersViolation(DomainError):
    """A generator tried to adjudicate its own output, or two powers were combined (CP-5)."""


class PointInTimeViolation(DomainError):
    """A read/compute observed information unavailable at the decision moment (PIT-1..4)."""


class IsolationBarrierViolation(DomainError):
    """A generation actor observed validation/OOS outcomes (AD-3, P2-07)."""


class ReproducibilityViolation(DomainError):
    """A deterministic result lacks a manifest or is not reproducible (CP-4, RP-2)."""


class ProvenanceRequired(DomainError):
    """A consequential artifact or memory lacks required lineage (CP-6, DP-3)."""
PY

cat > "$SRC/shared/repository.py" <<'PY'
"""Canonical repository interface patterns. Interfaces only — no persistence in the domain."""
from __future__ import annotations

from typing import Protocol, TypeVar

from .identifiers import ContentAddress, EntityId
from .time import AsOf

TAgg = TypeVar("TAgg")


class ReadRepository(Protocol[TAgg]):
    """Read side of a bounded-context repository."""

    def get(self, id: EntityId) -> TAgg: ...
    def exists(self, id: EntityId) -> bool: ...


class AppendOnlyRepository(Protocol[TAgg]):
    """Repository for immutable, versioned artifacts: add + supersede, never mutate (CP-2)."""

    def get(self, id: EntityId) -> TAgg: ...
    def add(self, aggregate: TAgg) -> None: ...


class ContentAddressedRepository(Protocol[TAgg]):
    """Retrieval of immutable artifacts by content address (P1-02)."""

    def by_content_address(self, address: ContentAddress) -> TAgg: ...


class AsOfReadPort(Protocol[TAgg]):
    """Point-in-time read; a call without an ``AsOf`` is impossible by construction (PIT-1)."""

    def read_as_of(self, id: EntityId, as_of: AsOf) -> TAgg: ...
PY

cat > "$SRC/shared/specification.py" <<'PY'
"""Specification pattern — a deterministic, testable predicate over a candidate (DE-1)."""
from __future__ import annotations

from typing import Protocol, TypeVar

TCandidate = TypeVar("TCandidate", contravariant=True)


class Specification(Protocol[TCandidate]):
    """Interface only; concrete specifications are versioned, golden-tested rules in outer layers."""

    def is_satisfied_by(self, candidate: TCandidate) -> bool: ...
PY

cat > "$SRC/shared/policy.py" <<'PY'
"""Policy marker — a named, versioned, deterministic rule set (behavior lives in an engine)."""
from __future__ import annotations

from typing import Protocol


class Policy(Protocol):
    """Marker interface for a deterministic domain policy."""

    ...
PY

cat > "$SRC/shared/factory.py" <<'PY'
"""Factory marker — encapsulates valid construction of a domain object. Interface only."""
from __future__ import annotations

from typing import Protocol, TypeVar

T = TypeVar("T", covariant=True)


class Factory(Protocol[T]):
    """Interface only; no construction logic in the domain foundation."""

    ...
PY

cat > "$SRC/shared/service.py" <<'PY'
"""Domain service marker — a stateless domain-service interface (behavior lives in outer engines)."""
from __future__ import annotations

from typing import Protocol


class DomainService(Protocol):
    """Marker interface for a domain service."""

    ...
PY

cat > "$SRC/shared/__init__.py" <<'PY'
"""core_domain.shared — the shared kernel: primitives every bounded context depends on."""
from __future__ import annotations

from .authority import ActorKind, ActorRef, Authority
from .entity import AggregateRoot, Entity
from .errors import (
    AuthorityViolation,
    Conflict,
    DomainError,
    ImmutabilityViolation,
    InvariantViolation,
    IsolationBarrierViolation,
    NotFound,
    PointInTimeViolation,
    ProvenanceRequired,
    ReproducibilityViolation,
    SeparationOfPowersViolation,
)
from .event import DomainEvent, DomainEventMeta
from .factory import Factory
from .identifiers import ContentAddress, EntityId, Ref, Version, VersionedId
from .policy import Policy
from .provenance import ArtifactClass, LineageRef, Provenance, RunManifestRef
from .repository import (
    AppendOnlyRepository,
    AsOfReadPort,
    ContentAddressedRepository,
    ReadRepository,
)
from .service import DomainService
from .specification import Specification
from .time import AsOf, BitemporalStamp, EventTime, KnowledgeTime, Timestamp
from .value_object import ValueObject

__all__ = [
    "ActorKind", "ActorRef", "Authority",
    "AggregateRoot", "Entity",
    "DomainError", "InvariantViolation", "NotFound", "Conflict", "ImmutabilityViolation",
    "AuthorityViolation", "SeparationOfPowersViolation", "PointInTimeViolation",
    "IsolationBarrierViolation", "ReproducibilityViolation", "ProvenanceRequired",
    "DomainEvent", "DomainEventMeta",
    "Factory", "Policy", "Specification", "DomainService",
    "ContentAddress", "EntityId", "Ref", "Version", "VersionedId",
    "ArtifactClass", "LineageRef", "Provenance", "RunManifestRef",
    "ReadRepository", "AppendOnlyRepository", "ContentAddressedRepository", "AsOfReadPort",
    "AsOf", "BitemporalStamp", "EventTime", "KnowledgeTime", "Timestamp",
    "ValueObject",
]
PY

cat > "$SRC/shared/README.md" <<'MD'
# core-domain · shared kernel

> **Phase 1.1 — pure domain primitives.** No business logic, no infrastructure.

## Purpose
The shared kernel every bounded context depends on: identities (content-addressed / versioned),
bitemporal time, the authority spine (propose/narrate/decide/approve), provenance, and the base
patterns (Entity, AggregateRoot, DomainEvent, Repository, Specification, Policy, Factory,
DomainService) and the canonical domain errors.

## Boundaries
Depends on nothing (innermost). All domain modules depend on it; it depends on no domain module.
No ambient time/RNG (time is a value object supplied by an injected clock).

## Related Governance Documents
CLAUDE.md (CP-2/4/5/6/7/8, NM-2, PIT-1..4, CS-3); Architecture V2 §4, §5.10; RB-20 · CODE; TDR §4.
MD

# ===========================================================================
# DOMAIN MODULE GENERATOR
# ===========================================================================
# Each domain gets: __init__.py, model.py, events.py, contracts.py, errors.py, README.md.
# model.py content is written per-domain (bespoke); the other files use compact per-domain heredocs.

# ---- research -------------------------------------------------------------
D="$SRC/research"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Research domain model — ideas and pre-registered, falsifiable hypotheses."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AggregateRoot, EntityId, VersionedId

# --- Value Objects ---------------------------------------------------------


@dataclass(frozen=True, slots=True)
class FalsifiablePrediction:
    """The testable, refutable claim of a hypothesis (SM-1)."""

    statement: str


@dataclass(frozen=True, slots=True)
class SuccessCriteria:
    """Frozen success criteria; post-hoc alteration is p-hacking and PROHIBITED (SM-2)."""

    description: str


@dataclass(frozen=True, slots=True)
class EconomicRationale:
    """Falsifiable economic mechanism required before promotion (AD-2, EXP-1)."""

    thesis: str


@dataclass(frozen=True, slots=True)
class PreRegistration:
    """The immutable pre-registration frozen before any evaluation (SM-2, P3-02)."""

    prediction: FalsifiablePrediction
    criteria: SuccessCriteria
    universe: str
    horizon: str
    planned_test: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Idea(AggregateRoot):
    """A registered idea — the entry point of the research lifecycle (SM-1)."""

    title: str
    rationale: EconomicRationale


@dataclass(eq=False)
class Hypothesis(AggregateRoot):
    """A pre-registered, falsifiable hypothesis (aggregate root)."""

    hypothesis_id: VersionedId
    idea: EntityId
    pre_registration: PreRegistration | None  # None until locked; set once, never mutated

# --- Specifications / Policies / Factories (interfaces are in contracts.py) --
PY

cat > "$D/events.py" <<'PY'
"""Research domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ResearchCreated(DomainEvent):
    """A new idea/research effort was registered (canonical event)."""

    idea_id: EntityId
    title: str


@dataclass(frozen=True, slots=True)
class HypothesisPreRegistered(DomainEvent):
    """A hypothesis's falsifiable prediction and success criteria were frozen (SM-2)."""

    hypothesis_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Research repository and domain-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Hypothesis, Idea, PreRegistration


class IdeaRepository(Protocol):
    """Append-only repository of ideas (immutable; supersede, never mutate)."""

    def get(self, id: EntityId) -> Idea: ...
    def add(self, idea: Idea) -> None: ...


class HypothesisRepository(Protocol):
    """Append-only repository of hypotheses."""

    def get(self, id: EntityId) -> Hypothesis: ...
    def add(self, hypothesis: Hypothesis) -> None: ...


class PreRegistrationService(Protocol):
    """Interface: freezes a hypothesis's pre-registration (lock is one-way, SM-2). No logic here."""

    def pre_register(self, hypothesis: EntityId, registration: PreRegistration) -> None: ...
PY

cat > "$D/errors.py" <<'PY'
"""Research domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class PreRegistrationLocked(DomainError):
    """Attempt to alter success criteria after pre-registration (p-hacking, FB-8)."""


class HypothesisNotFalsifiable(DomainError):
    """A hypothesis lacks a falsifiable prediction (SM-1)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Research bounded context — the research lifecycle: ideas and pre-registered hypotheses."""
from __future__ import annotations

from .contracts import HypothesisRepository, IdeaRepository, PreRegistrationService
from .errors import HypothesisNotFalsifiable, PreRegistrationLocked
from .events import HypothesisPreRegistered, ResearchCreated
from .model import (
    EconomicRationale,
    FalsifiablePrediction,
    Hypothesis,
    Idea,
    PreRegistration,
    SuccessCriteria,
)

__all__ = [
    "FalsifiablePrediction", "SuccessCriteria", "EconomicRationale", "PreRegistration",
    "Idea", "Hypothesis",
    "ResearchCreated", "HypothesisPreRegistered",
    "IdeaRepository", "HypothesisRepository", "PreRegistrationService",
    "PreRegistrationLocked", "HypothesisNotFalsifiable",
]
PY
dreadme "$D" "Research" \
"Produce and manage the research lifecycle scaffolding: registered ideas and pre-registered, falsifiable hypotheses with economic rationale." \
"Model ideas and hypotheses; carry immutable pre-registration; require a falsifiable prediction and success criteria before evaluation." \
"Produces candidates and descriptive structure only; it does NOT adjudicate significance or acceptance (that is the Validation domain / Quantitative Engine Layer)." \
"Feeds Experiment, Feature, and Signal domains; isolated from Validation outcomes (isolation barrier)." \
"IdeaRepository, HypothesisRepository (append-only); PreRegistrationService (interface); events ResearchCreated, HypothesisPreRegistered." \
"MUST NOT validate its own output; MUST NOT access OOS/validation results; MUST NOT alter pre-registration after lock." \
"CLAUDE.md (SM-1..5, AD-2/3, EXP-1); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P3-02."

# ---- dataset --------------------------------------------------------------
D="$SRC/dataset"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Dataset domain model — certified, point-in-time, provenance-bearing data (definitions only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import (
    AggregateRoot,
    BitemporalStamp,
    Provenance,
    VersionedId,
)

# --- Value Objects ---------------------------------------------------------


class CertificationStatus(Enum):
    UNCERTIFIED = "uncertified"
    CERTIFIED = "certified"
    QUARANTINED = "quarantined"  # bad data is quarantined, never silently repaired (DI-2)


@dataclass(frozen=True, slots=True)
class DataQualityReport:
    """Outcome of the certification/quality gate (descriptive)."""

    passed: bool
    summary: str


@dataclass(frozen=True, slots=True)
class Symbology:
    """As-of symbology mapping (reference data queried as-of, PIT-2)."""

    scheme: str


@dataclass(frozen=True, slots=True)
class UniverseSnapshot:
    """A survivorship-safe, as-of universe membership snapshot (PIT-2)."""

    as_of_label: str
    survivorship_safe: bool


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Vintage(AggregateRoot):
    """A restatement recorded as a NEW vintage; vintages are never overwritten (DI-3)."""

    stamp: BitemporalStamp
    provenance: Provenance


@dataclass(eq=False)
class Dataset(AggregateRoot):
    """A certified dataset version (aggregate root); immutable and versioned (CP-2)."""

    dataset_id: VersionedId
    certification: CertificationStatus
    provenance: Provenance
PY

cat > "$D/events.py" <<'PY'
"""Dataset domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import EntityId, DomainEvent


@dataclass(frozen=True, slots=True)
class DatasetRegistered(DomainEvent):
    """A dataset version was registered."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidated(DomainEvent):
    """A dataset passed certification and is safe for research (canonical event, DI-1)."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class VintageRecorded(DomainEvent):
    """A restatement was recorded as a new vintage (DI-3)."""

    dataset_id: EntityId
    vintage_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Dataset repository, As-Of read port, and certification-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import AsOf, EntityId

from .model import Dataset, DataQualityReport, Vintage


class DatasetRepository(Protocol):
    """Append-only repository of certified dataset versions (immutable, CP-2)."""

    def get(self, id: EntityId) -> Dataset: ...
    def add(self, dataset: Dataset) -> None: ...


class VintageRepository(Protocol):
    """Append-only vintage store; a vintage is never overwritten (DI-3)."""

    def get(self, id: EntityId) -> Vintage: ...
    def add(self, vintage: Vintage) -> None: ...


class AsOfGateway(Protocol):
    """The sole read path for history; a read without an ``AsOf`` is impossible (PIT-1, AV2-22)."""

    def read_as_of(self, dataset: EntityId, as_of: AsOf) -> Dataset: ...


class CertificationService(Protocol):
    """Interface: certifies a dataset version. Deterministic engine implements it, not the domain."""

    def certify(self, dataset: EntityId) -> DataQualityReport: ...
PY

cat > "$D/errors.py" <<'PY'
"""Dataset domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class NonAsOfRead(DomainError):
    """A historical read was attempted without an ``AsOf`` (PIT-1, fail-closed)."""


class VintageOverwrite(DomainError):
    """An attempt to overwrite an existing vintage (DI-3)."""


class UncertifiedDataExposed(DomainError):
    """Uncertified or raw data was exposed to research/AI (DI-1)."""


class SurvivorshipUnsafe(DomainError):
    """A universe/dataset was certified without survivorship safety (FB-7)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Dataset bounded context — certified, point-in-time, provenance-bearing data."""
from __future__ import annotations

from .contracts import AsOfGateway, CertificationService, DatasetRepository, VintageRepository
from .errors import NonAsOfRead, SurvivorshipUnsafe, UncertifiedDataExposed, VintageOverwrite
from .events import DatasetRegistered, DatasetValidated, VintageRecorded
from .model import (
    CertificationStatus,
    Dataset,
    DataQualityReport,
    Symbology,
    UniverseSnapshot,
    Vintage,
)

__all__ = [
    "CertificationStatus", "DataQualityReport", "Symbology", "UniverseSnapshot",
    "Dataset", "Vintage",
    "DatasetRegistered", "DatasetValidated", "VintageRecorded",
    "DatasetRepository", "VintageRepository", "AsOfGateway", "CertificationService",
    "NonAsOfRead", "VintageOverwrite", "UncertifiedDataExposed", "SurvivorshipUnsafe",
]
PY
dreadme "$D" "Dataset" \
"Model certified, point-in-time-correct, provenance-bearing data and the vintage/restatement model that research stands on." \
"Model datasets, vintages, certification status, survivorship-safe universes, and as-of symbology; require provenance on every dataset." \
"The As-Of Gateway is the sole read path and fails closed without an as_of; the domain models this port but does not persist or read data." \
"Feeds Feature and every deterministic engine via the As-Of Gateway; the OOS partition is sealed from research/AI." \
"DatasetRepository, VintageRepository (append-only); AsOfGateway (as-of read port); CertificationService; events DatasetRegistered, DatasetValidated, VintageRecorded." \
"MUST NOT serve non-as-of or uncertified data; MUST NOT overwrite a vintage; MUST NOT expose OOS to research/AI." \
"CLAUDE.md (DI-1..3, DP-1..3, PIT-1..4); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; RB-08 · PIT; Dataset Governance; P1-01."

# ---- experiment -----------------------------------------------------------
D="$SRC/experiment"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Experiment domain model — registered experiments, immutable manifests, and the Trial Ledger."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, EntityId, Provenance, RunManifestRef, VersionedId

# --- Value Objects ---------------------------------------------------------


class TrialOutcome(Enum):
    RUN = "run"
    DISCARDED = "discarded"
    FAILED = "failed"  # every trial is counted for multiple-testing control (EX-4)


@dataclass(frozen=True, slots=True)
class ExperimentManifest:
    """The immutable manifest that makes an experiment independently repeatable (EX-2, RP-1)."""

    run_manifest: RunManifestRef
    config_hash: str


@dataclass(frozen=True, slots=True)
class MultipleTestingBudgetRef:
    """Reference to the budget an experiment is accounted against (SI-1, P2-02)."""

    id: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Trial(AggregateRoot):
    """A single trial recorded in the immutable Trial Ledger before it runs (SM-5, P2-01)."""

    experiment: EntityId
    outcome: TrialOutcome


@dataclass(eq=False)
class Experiment(AggregateRoot):
    """A registered experiment (aggregate root); metadata is immutable (EX-3)."""

    experiment_id: VersionedId
    hypothesis: EntityId
    manifest: ExperimentManifest
    provenance: Provenance
PY

cat > "$D/events.py" <<'PY'
"""Experiment domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExperimentRegistered(DomainEvent):
    """An experiment was registered with an immutable manifest before execution (canonical, EX-1)."""

    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class TrialRecorded(DomainEvent):
    """A trial was appended to the Trial Ledger (run, discarded, or failed) (EX-4)."""

    experiment_id: EntityId
    trial_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Experiment repository and Trial-Ledger interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Experiment, Trial


class ExperimentRepository(Protocol):
    """Append-only repository of experiments; correcting one creates a new version (EX-3)."""

    def get(self, id: EntityId) -> Experiment: ...
    def add(self, experiment: Experiment) -> None: ...


class TrialLedger(Protocol):
    """Append-only, tamper-evident ledger; a trial is enrolled BEFORE it runs (P2-01)."""

    def append(self, trial: Trial) -> None: ...
    def get(self, id: EntityId) -> Trial: ...


class ReproducibilityService(Protocol):
    """Interface: repeats an experiment from its manifest (deterministic engine implements it)."""

    def repeat(self, experiment: EntityId) -> bool: ...
PY

cat > "$D/errors.py" <<'PY'
"""Experiment domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class UnregisteredExperiment(DomainError):
    """An experiment was run without prior registration and a Trial-Ledger entry (FB-5)."""


class ManifestMutation(DomainError):
    """An attempt to edit an experiment manifest in place (EX-3)."""


class TrialNotCounted(DomainError):
    """A trial informed a decision without being counted in the ledger (EX-4)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Experiment bounded context — registered experiments, manifests, and the Trial Ledger."""
from __future__ import annotations

from .contracts import ExperimentRepository, ReproducibilityService, TrialLedger
from .errors import ManifestMutation, TrialNotCounted, UnregisteredExperiment
from .events import ExperimentRegistered, TrialRecorded
from .model import (
    Experiment,
    ExperimentManifest,
    MultipleTestingBudgetRef,
    Trial,
    TrialOutcome,
)

__all__ = [
    "TrialOutcome", "ExperimentManifest", "MultipleTestingBudgetRef",
    "Experiment", "Trial",
    "ExperimentRegistered", "TrialRecorded",
    "ExperimentRepository", "TrialLedger", "ReproducibilityService",
    "UnregisteredExperiment", "ManifestMutation", "TrialNotCounted",
]
PY
dreadme "$D" "Experiment" \
"Model registered experiments with immutable manifests and the append-only Trial Ledger that underpins multiple-testing control." \
"Model experiments, manifests, and trials; require registration and Trial-Ledger enrollment before execution; count every trial." \
"Records and structures; it does not compute significance or budgets (that is the Validation domain)." \
"Links Research (hypotheses) to Validation (multiple-testing budget); shares the Trial Ledger with Validation." \
"ExperimentRepository (append-only), TrialLedger (append-only); ReproducibilityService; events ExperimentRegistered, TrialRecorded." \
"MUST NOT run an unregistered experiment; MUST NOT mutate a manifest; MUST NOT let a trial inform a decision uncounted." \
"CLAUDE.md (SM-5, EX-1..4, SI-1); Architecture V2 §5.5/§5.6; RB-01 · STAT; Experiment Tracking Governance; P2-01/02."

# ---- feature --------------------------------------------------------------
D="$SRC/feature"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Feature domain model — declarative, PIT-bound, leakage-clean, provenance-bearing features."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, VersionedId

# --- Value Objects ---------------------------------------------------------


class AcceptanceStatus(Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class FeatureSpec:
    """A declarative feature definition computed only through the as-of path (FA-1, PIT-3)."""

    definition: str


@dataclass(frozen=True, slots=True)
class LeakageReport:
    """Outcome of the Leakage Harness; must pass before acceptance (FA-2, P2-03)."""

    clean: bool
    summary: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Feature(AggregateRoot):
    """A versioned feature (aggregate root); accepted only when leakage-clean and provenanced."""

    feature_id: VersionedId
    spec: FeatureSpec
    status: AcceptanceStatus
    provenance: Provenance
PY

cat > "$D/events.py" <<'PY'
"""Feature domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class FeatureProposed(DomainEvent):
    """A feature definition was proposed (advisory, pre-acceptance)."""

    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureAccepted(DomainEvent):
    """A feature passed the leakage harness and acceptance gate (canonical event, FA-1..4)."""

    feature_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Feature repository, marketplace, and leakage-harness interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Feature, LeakageReport


class FeatureRepository(Protocol):
    """Append-only repository of feature versions (immutable; changes create a new version, FA-4)."""

    def get(self, id: EntityId) -> Feature: ...
    def add(self, feature: Feature) -> None: ...


class FeatureMarketplace(Protocol):
    """Read view over accepted features (marketplace)."""

    def get(self, id: EntityId) -> Feature: ...


class LeakageHarness(Protocol):
    """Interface: evaluates a feature for leakage/look-ahead. Deterministic engine implements it."""

    def check(self, feature: EntityId) -> LeakageReport: ...
PY

cat > "$D/errors.py" <<'PY'
"""Feature domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class LeakageDetected(DomainError):
    """A feature failed the leakage harness (FA-2, P2-03)."""


class LookAheadBias(DomainError):
    """A feature used full-sample/future-leaking statistics (PIT-3, FB-7)."""


class MissingFeatureProvenance(DomainError):
    """A feature lacks provenance (FB-11, DP-3)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Feature bounded context — declarative, PIT-bound, leakage-clean features."""
from __future__ import annotations

from .contracts import FeatureMarketplace, FeatureRepository, LeakageHarness
from .errors import LeakageDetected, LookAheadBias, MissingFeatureProvenance
from .events import FeatureAccepted, FeatureProposed
from .model import AcceptanceStatus, Feature, FeatureSpec, LeakageReport

__all__ = [
    "AcceptanceStatus", "FeatureSpec", "LeakageReport", "Feature",
    "FeatureProposed", "FeatureAccepted",
    "FeatureRepository", "FeatureMarketplace", "LeakageHarness",
    "LeakageDetected", "LookAheadBias", "MissingFeatureProvenance",
]
PY
dreadme "$D" "Feature" \
"Model declarative, point-in-time-bound, leakage-clean, provenance-bearing features and the Feature Marketplace." \
"Model feature specs, acceptance status, leakage reports, and provenance; a feature is accepted only when leakage-clean and provenanced." \
"Proposes and structures; acceptance is a deterministic gate (Leakage Harness + significance), not decided here." \
"Consumes Dataset via the As-Of Gateway; feeds Signal; acceptance gated by the Quantitative Engine Layer." \
"FeatureRepository (append-only), FeatureMarketplace (read); LeakageHarness; events FeatureProposed, FeatureAccepted." \
"MUST NOT accept its own features; MUST NOT use look-ahead/full-sample statistics; MUST NOT exist without provenance." \
"CLAUDE.md (FA-1..4, PIT-3, DP-3); Architecture V2 §5.5/§5.8; RB-09/10 · FAR; Feature Registry; P1-06, P2-03."

# ---- signal ---------------------------------------------------------------
D="$SRC/signal"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Signal domain model — the signal generation lifecycle (net-of-cost, isolation-respecting)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, VersionedId

# --- Value Objects ---------------------------------------------------------


class SignalLifecycle(Enum):
    DRAFT = "draft"
    REGISTERED = "registered"
    RETIRED = "retired"  # a signal has a defined death, not only a birth (RL-2)


@dataclass(frozen=True, slots=True)
class SignalSpec:
    """Declarative signal definition, net-of-cost from the first screen (AD-1)."""

    definition: str
    net_of_cost: bool


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Signal(AggregateRoot):
    """A versioned signal (aggregate root) derived from accepted features."""

    signal_id: VersionedId
    feature: Ref  # -> feature.Feature (cross-context reference by identity, SE-2)
    spec: SignalSpec
    lifecycle: SignalLifecycle
    provenance: Provenance
PY

cat > "$D/events.py" <<'PY'
"""Signal domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class SignalGenerated(DomainEvent):
    """A signal was generated from accepted features (canonical event)."""

    signal_id: EntityId


@dataclass(frozen=True, slots=True)
class SignalRetired(DomainEvent):
    """A decayed/crowded signal was retired through the governed lifecycle (RL-2)."""

    signal_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Signal repository and lifecycle-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Signal


class SignalRepository(Protocol):
    """Append-only repository of signal versions (immutable; register-before-use)."""

    def get(self, id: EntityId) -> Signal: ...
    def add(self, signal: Signal) -> None: ...


class SignalLifecycleService(Protocol):
    """Interface: governs registration and retirement transitions. No logic here."""

    def register(self, signal: EntityId) -> None: ...
    def retire(self, signal: EntityId) -> None: ...
PY

cat > "$D/errors.py" <<'PY'
"""Signal domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class GrossSelection(DomainError):
    """A signal was selected on gross (pre-cost) performance (AD-1, AP-10)."""


class GeneratorObservedValidation(DomainError):
    """A generator observed validation/OOS outcomes (AD-3, isolation barrier P2-07)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Signal bounded context — the signal generation lifecycle."""
from __future__ import annotations

from .contracts import SignalLifecycleService, SignalRepository
from .errors import GeneratorObservedValidation, GrossSelection
from .events import SignalGenerated, SignalRetired
from .model import Signal, SignalLifecycle, SignalSpec

__all__ = [
    "SignalLifecycle", "SignalSpec", "Signal",
    "SignalGenerated", "SignalRetired",
    "SignalRepository", "SignalLifecycleService",
    "GrossSelection", "GeneratorObservedValidation",
]
PY
dreadme "$D" "Signal" \
"Model the signal generation lifecycle: net-of-cost, isolation-respecting signals derived from accepted features." \
"Model signal specs and lifecycle (register-before-use, defined retirement); require net-of-cost definition." \
"Generates candidates; never adjudicates; never observes validation/OOS outcomes." \
"Consumes Feature; feeds Strategy; acceptance gated by the deterministic engines." \
"SignalRepository (append-only); SignalLifecycleService; events SignalGenerated, SignalRetired." \
"MUST NOT select on gross performance; MUST NOT observe validation/OOS (isolation barrier); MUST NOT self-accept." \
"CLAUDE.md (AD-1..4, RL-2, CP-5); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry; P2-07."

# ---- strategy -------------------------------------------------------------
D="$SRC/strategy"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Strategy domain model — the strategy lifecycle, including a defined death (RL-2)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, VersionedId

# --- Value Objects ---------------------------------------------------------


class StrategyLifecycle(Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    DEPLOYED = "deployed"
    RETIRED = "retired"


@dataclass(frozen=True, slots=True)
class CapitalEligibilityTokenRef:
    """Reference to the governance-issued capital-eligibility token (P2-09).

    The token aggregate itself lives in the governance context; strategy references it by id.
    """

    id: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Strategy(AggregateRoot):
    """A strategy (aggregate root); becomes capital-eligible only via the scientific gate."""

    strategy_id: VersionedId
    signal: Ref  # -> signal.Signal
    lifecycle: StrategyLifecycle
    eligibility: CapitalEligibilityTokenRef | None  # None until issued (RG-1)
    provenance: Provenance
PY

cat > "$D/events.py" <<'PY'
"""Strategy domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class StrategyRegistered(DomainEvent):
    """A strategy was registered."""

    strategy_id: EntityId


@dataclass(frozen=True, slots=True)
class StrategyApproved(DomainEvent):
    """A strategy passed the scientific gate and received a capital-eligibility token (canonical)."""

    strategy_id: EntityId
    eligibility_token: str


@dataclass(frozen=True, slots=True)
class StrategyRetired(DomainEvent):
    """A strategy was retired through the governed lifecycle (RL-2)."""

    strategy_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Strategy repository and lifecycle-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Strategy


class StrategyRepository(Protocol):
    """Append-only repository of strategy versions (immutable)."""

    def get(self, id: EntityId) -> Strategy: ...
    def add(self, strategy: Strategy) -> None: ...


class StrategyLifecycleService(Protocol):
    """Interface: governs lifecycle transitions incl. retirement. No adjudication here."""

    def retire(self, strategy: EntityId) -> None: ...
PY

cat > "$D/errors.py" <<'PY'
"""Strategy domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class NotCapitalEligible(DomainError):
    """A strategy lacks a valid capital-eligibility token (RG-1, FB-12)."""


class MissingReplication(DomainError):
    """A strategy reached capital without independent replication (VS-4, P2-08)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Strategy bounded context — the strategy lifecycle with a defined death."""
from __future__ import annotations

from .contracts import StrategyLifecycleService, StrategyRepository
from .errors import MissingReplication, NotCapitalEligible
from .events import StrategyApproved, StrategyRegistered, StrategyRetired
from .model import CapitalEligibilityTokenRef, Strategy, StrategyLifecycle

__all__ = [
    "StrategyLifecycle", "CapitalEligibilityTokenRef", "Strategy",
    "StrategyRegistered", "StrategyApproved", "StrategyRetired",
    "StrategyRepository", "StrategyLifecycleService",
    "NotCapitalEligible", "MissingReplication",
]
PY
dreadme "$D" "Strategy" \
"Model the strategy lifecycle, including a defined retirement (RL-2), and the reference to its capital-eligibility token." \
"Model strategy versions, lifecycle state, and eligibility reference; require the scientific gate and replication before capital." \
"Structures the lifecycle; does not adjudicate eligibility (the Validation domain / scientific gate does)." \
"Consumes Signal; references governance-issued capital-eligibility tokens; feeds Portfolio." \
"StrategyRepository (append-only); StrategyLifecycleService; events StrategyRegistered, StrategyApproved, StrategyRetired." \
"MUST NOT consume capital without an eligibility token; MUST NOT promote without replication and the scientific gate." \
"CLAUDE.md (RL-1/2, FC-1..5, RG-1..3); Architecture V2 §5.5/§5.6; Strategy Registry; P2-08/09."

# ---- portfolio ------------------------------------------------------------
D="$SRC/portfolio"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Portfolio domain model — immutable, rationale-bearing portfolio snapshots (net-of-cost)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Ref

# --- Value Objects ---------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Weight:
    """A target allocation weight for an eligible alpha (dimensionless)."""

    value: float


@dataclass(frozen=True, slots=True)
class Allocation:
    """A single strategy's allocation within a portfolio (net-of-cost)."""

    strategy: Ref  # -> strategy.Strategy
    weight: Weight


@dataclass(frozen=True, slots=True)
class OptimizationConstraints:
    """Constraints the optimizer must respect (within Risk limits, net-of-cost) (PS-2)."""

    description: str


@dataclass(frozen=True, slots=True)
class PortfolioRationale:
    """The recorded rationale attached to a portfolio snapshot (PS-4)."""

    text: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Portfolio(AggregateRoot):
    """An immutable portfolio snapshot (aggregate root); content-addressed (CP-2, PS-4)."""

    snapshot: ContentAddress
    allocations: tuple[Allocation, ...]
    rationale: PortfolioRationale
    provenance: Provenance
PY

cat > "$D/events.py" <<'PY'
"""Portfolio domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class PortfolioConstructed(DomainEvent):
    """A portfolio snapshot was constructed from capital-eligible alphas (canonical event)."""

    portfolio_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Portfolio repository and optimizer interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import OptimizationConstraints, Portfolio


class PortfolioRepository(Protocol):
    """Append-only repository of immutable portfolio snapshots (PS-4)."""

    def get(self, id: EntityId) -> Portfolio: ...
    def add(self, portfolio: Portfolio) -> None: ...


class PortfolioOptimizer(Protocol):
    """Interface: deterministic, net-of-cost optimization within constraints (PS-2, PS-3).

    Implemented by a deterministic engine; an LLM MUST NOT decide allocation or sizing.
    """

    def construct(self, constraints: OptimizationConstraints) -> Portfolio: ...
PY

cat > "$D/errors.py" <<'PY'
"""Portfolio domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class IneligibleAlpha(DomainError):
    """Construction consumed an alpha lacking a valid eligibility token (PS-1)."""


class GrossOptimization(DomainError):
    """Optimization used gross (pre-cost) returns (PS-2)."""


class ConstraintViolation(DomainError):
    """A portfolio violates a risk/optimization constraint (PS-2)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Portfolio bounded context — immutable, net-of-cost portfolio snapshots."""
from __future__ import annotations

from .contracts import PortfolioOptimizer, PortfolioRepository
from .errors import ConstraintViolation, GrossOptimization, IneligibleAlpha
from .events import PortfolioConstructed
from .model import (
    Allocation,
    OptimizationConstraints,
    Portfolio,
    PortfolioRationale,
    Weight,
)

__all__ = [
    "Weight", "Allocation", "OptimizationConstraints", "PortfolioRationale", "Portfolio",
    "PortfolioConstructed",
    "PortfolioRepository", "PortfolioOptimizer",
    "IneligibleAlpha", "GrossOptimization", "ConstraintViolation",
]
PY
dreadme "$D" "Portfolio" \
"Model immutable, rationale-bearing portfolio snapshots produced by a deterministic, net-of-cost optimizer from capital-eligible alphas." \
"Model allocations, weights, constraints, and rationale; every portfolio is an immutable, content-addressed snapshot." \
"Consumes only eligible alphas; never re-adjudicates whether a signal is real; the optimizer is deterministic." \
"Consumes Strategy (eligible) and Risk limits; feeds Execution." \
"PortfolioRepository (append-only); PortfolioOptimizer (deterministic interface); event PortfolioConstructed." \
"MUST NOT optimize on gross returns; MUST NOT let an LLM decide allocation/sizing; MUST NOT consume ineligible alphas." \
"CLAUDE.md (PS-1..4, AI-1); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry; P1-08."

# ---- risk -----------------------------------------------------------------
D="$SRC/risk"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Risk domain model — deterministic limits, assessments, and the human-invocable kill-switch."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Ref

# --- Value Objects ---------------------------------------------------------


class RiskVerdict(Enum):
    WITHIN_LIMITS = "within_limits"
    BREACH = "breach"


@dataclass(frozen=True, slots=True)
class RiskLimit:
    """A deterministic, versioned, testable limit (exposure/leverage/concentration/drawdown)."""

    name: str
    threshold: float


@dataclass(frozen=True, slots=True)
class Exposure:
    """A measured exposure value (descriptive analytics)."""

    name: str
    value: float


@dataclass(frozen=True, slots=True)
class LimitBreach:
    """A recorded breach of a risk limit."""

    limit: RiskLimit
    observed: float


class KillSwitchState(Enum):
    ARMED = "armed"
    ENGAGED = "engaged"  # forces execution into paper/halt (RS-3); human-invocable, never AI-gated


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class RiskLimitSet(AggregateRoot):
    """A versioned set of risk limits (aggregate root)."""

    limits: tuple[RiskLimit, ...]


@dataclass(eq=False)
class RiskAssessment(AggregateRoot):
    """An independent risk assessment of a portfolio/strategy (aggregate root)."""

    subject: Ref  # -> portfolio.Portfolio or strategy.Strategy
    verdict: RiskVerdict
PY

cat > "$D/events.py" <<'PY'
"""Risk domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class RiskValidated(DomainEvent):
    """Independent risk sign-off was granted at promotion (canonical event, RS-2)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class LimitBreached(DomainEvent):
    """A deterministic risk limit was breached (RS-1)."""

    subject_id: EntityId
    limit_name: str


@dataclass(frozen=True, slots=True)
class KillSwitchEngaged(DomainEvent):
    """The kill-switch was engaged, forcing paper/halt (human-invocable, RS-3)."""

    engaged_by: str
PY

cat > "$D/contracts.py" <<'PY'
"""Risk repository, limit-engine, and kill-switch interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import ActorRef, EntityId

from .model import RiskAssessment, RiskLimitSet, RiskVerdict


class RiskLimitRepository(Protocol):
    """Append-only repository of versioned risk-limit sets."""

    def get(self, id: EntityId) -> RiskLimitSet: ...
    def add(self, limits: RiskLimitSet) -> None: ...


class RiskAssessmentRepository(Protocol):
    """Append-only repository of independent risk assessments."""

    def get(self, id: EntityId) -> RiskAssessment: ...
    def add(self, assessment: RiskAssessment) -> None: ...


class RiskLimitEngine(Protocol):
    """Interface: deterministic limit evaluation (RS-1). Deterministic engine implements it."""

    def evaluate(self, subject: EntityId) -> RiskVerdict: ...


class KillSwitch(Protocol):
    """Interface: forces execution to paper/halt; human-invocable, NEVER AI-gated (RS-3, HO-4)."""

    def engage(self, invoked_by: ActorRef) -> None: ...
PY

cat > "$D/errors.py" <<'PY'
"""Risk domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class HardLimitBreach(DomainError):
    """A hard risk limit was breached without a halt (RS-1)."""


class AIHaltAttempt(DomainError):
    """An AI attempted to decide a risk halt/kill-switch (AI-1, RS-1)."""


class RiskIndependenceViolation(DomainError):
    """Risk oversight was not independent of research/portfolio (RS-2, CP-5)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Risk bounded context — independent, deterministic limits and the kill-switch."""
from __future__ import annotations

from .contracts import (
    KillSwitch,
    RiskAssessmentRepository,
    RiskLimitEngine,
    RiskLimitRepository,
)
from .errors import AIHaltAttempt, HardLimitBreach, RiskIndependenceViolation
from .events import KillSwitchEngaged, LimitBreached, RiskValidated
from .model import (
    Exposure,
    KillSwitchState,
    LimitBreach,
    RiskAssessment,
    RiskLimit,
    RiskLimitSet,
    RiskVerdict,
)

__all__ = [
    "RiskVerdict", "RiskLimit", "Exposure", "LimitBreach", "KillSwitchState",
    "RiskLimitSet", "RiskAssessment",
    "RiskValidated", "LimitBreached", "KillSwitchEngaged",
    "RiskLimitRepository", "RiskAssessmentRepository", "RiskLimitEngine", "KillSwitch",
    "HardLimitBreach", "AIHaltAttempt", "RiskIndependenceViolation",
]
PY
dreadme "$D" "Risk" \
"Model independent, deterministic risk limits and assessments and the human-invocable kill-switch that can halt anything." \
"Model limits, exposures, breaches, verdicts, and kill-switch state; risk sign-off is independent of research and portfolio." \
"Deterministic and independent; the kill-switch is human-invocable and never AI-gated; overrides the first line." \
"Assesses Portfolio and Strategy; halts Execution; independent of research/portfolio (CP-5)." \
"RiskLimitRepository, RiskAssessmentRepository; RiskLimitEngine, KillSwitch (interfaces); events RiskValidated, LimitBreached, KillSwitchEngaged." \
"MUST NOT be overridden by the first line; MUST NOT delegate halts to AI; MUST NOT report to research." \
"CLAUDE.md (RS-1..4, CP-5, HO-4); Architecture V2 §5.7; RB-13 · RISK; P1-03, P6-03."

# ---- validation -----------------------------------------------------------
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Validation domain model — the deterministic gauntlet, one-shot holdout, replication, gate."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Ref

# --- Value Objects ---------------------------------------------------------


class Verdict(Enum):
    PASS = "pass"
    FAIL = "fail"


@dataclass(frozen=True, slots=True)
class DeflatedMetric:
    """A performance statistic deflated for the effective number of trials (SI-3, P2-02)."""

    name: str
    value: float


@dataclass(frozen=True, slots=True)
class PBOResult:
    """Probability of backtest overfitting (descriptive)."""

    probability: float


@dataclass(frozen=True, slots=True)
class HoldoutAllocation:
    """A one-shot, budgeted, rotating out-of-sample allocation; reuse is PROHIBITED (SI-4, P2-05)."""

    budget_id: str
    consumed: bool


@dataclass(frozen=True, slots=True)
class ReplicationResult:
    """Independent replication by a separate code path (VS-4, P2-08)."""

    reproduced: bool


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class ValidationRun(AggregateRoot):
    """A deterministic validation run over a candidate (aggregate root)."""

    subject: Ref  # -> feature.Feature / signal.Signal / strategy.Strategy
    verdict: Verdict
PY

cat > "$D/events.py" <<'PY'
"""Validation domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ValidationCompleted(DomainEvent):
    """A deterministic validation run produced a verdict (VS-1)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class HoldoutConsumed(DomainEvent):
    """The one-shot holdout was consumed for a candidate (SI-4, P2-05)."""

    subject_id: EntityId
    budget_id: str


@dataclass(frozen=True, slots=True)
class CapitalEligibilityIssued(DomainEvent):
    """The scientific gate issued a capital-eligibility token (P2-09)."""

    subject_id: EntityId
    eligibility_token: str
PY

cat > "$D/contracts.py" <<'PY'
"""Validation engine interfaces — the deterministic core's adjudication ports (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import ReplicationResult, ValidationRun, Verdict


class ValidationRunRepository(Protocol):
    """Append-only repository of validation runs."""

    def get(self, id: EntityId) -> ValidationRun: ...
    def add(self, run: ValidationRun) -> None: ...


class MultipleTestingEnforcer(Protocol):
    """Interface: deterministic multiple-testing budget gate over the Trial Ledger (P2-02)."""

    def check_budget(self, subject: EntityId) -> Verdict: ...


class ValidationGauntlet(Protocol):
    """Interface: leakage harness + purged/embargoed CPCV + PBO (deterministic)."""

    def run(self, subject: EntityId) -> Verdict: ...


class HoldoutEmbargoManager(Protocol):
    """Interface: one-shot, rotating holdout allocation; iterative reuse is PROHIBITED (SI-4)."""

    def allocate(self, subject: EntityId) -> None: ...


class ReplicationEngine(Protocol):
    """Interface: independent replication by a separate code path (VS-4, P2-08)."""

    def replicate(self, subject: EntityId) -> ReplicationResult: ...


class ScientificGate(Protocol):
    """Interface: the Pre-Capital Scientific Gate that issues capital-eligibility tokens (P2-09).

    Deterministic; an LLM MUST NEVER assert significance or issue a token (AI-2, AI-3).
    """

    def adjudicate(self, subject: EntityId) -> Verdict: ...
PY

cat > "$D/errors.py" <<'PY'
"""Validation domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class OOSReuse(DomainError):
    """Iterative re-testing against the out-of-sample resource (SI-4, P2-05)."""


class UndeflatedSignificance(DomainError):
    """Significance asserted without deflation for the number of trials (SI-3)."""


class LLMValidationAttempt(DomainError):
    """An LLM attempted to assert significance or a verdict (AI-2, FB-2)."""


class ReplicationFailed(DomainError):
    """A candidate failed independent replication (VS-4, P2-08)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Validation bounded context — the deterministic adjudication core (gauntlet, holdout, gate)."""
from __future__ import annotations

from .contracts import (
    HoldoutEmbargoManager,
    MultipleTestingEnforcer,
    ReplicationEngine,
    ScientificGate,
    ValidationGauntlet,
    ValidationRunRepository,
)
from .errors import LLMValidationAttempt, OOSReuse, ReplicationFailed, UndeflatedSignificance
from .events import CapitalEligibilityIssued, HoldoutConsumed, ValidationCompleted
from .model import (
    DeflatedMetric,
    HoldoutAllocation,
    PBOResult,
    ReplicationResult,
    ValidationRun,
    Verdict,
)

__all__ = [
    "Verdict", "DeflatedMetric", "PBOResult", "HoldoutAllocation", "ReplicationResult",
    "ValidationRun",
    "ValidationCompleted", "HoldoutConsumed", "CapitalEligibilityIssued",
    "ValidationRunRepository", "MultipleTestingEnforcer", "ValidationGauntlet",
    "HoldoutEmbargoManager", "ReplicationEngine", "ScientificGate",
    "OOSReuse", "UndeflatedSignificance", "LLMValidationAttempt", "ReplicationFailed",
]
PY
dreadme "$D" "Validation" \
"Model the deterministic validation gauntlet, one-shot holdout, independent replication, and the Pre-Capital Scientific Gate that issues capital-eligibility tokens." \
"Model verdicts, deflated metrics, PBO, holdout allocations, and replication; every decision is deterministic and golden-tested." \
"This is the ONLY place significance/validation/promotion is adjudicated; no LLM is ever in the path; the platform runs it with all AI suspended." \
"Consumes Experiment (Trial Ledger) and Dataset (sealed OOS); issues tokens consumed by Strategy/Governance; firewalled from Research generation." \
"ValidationRunRepository; MultipleTestingEnforcer, ValidationGauntlet, HoldoutEmbargoManager, ReplicationEngine, ScientificGate (interfaces); events ValidationCompleted, HoldoutConsumed, CapitalEligibilityIssued." \
"MUST NOT let an LLM assert significance/verdict; MUST NOT reuse OOS iteratively; MUST NOT present undeflated significance; MUST NOT expose OOS to generators." \
"CLAUDE.md (SI-1..5, VS-1..4, AI-2/3); Architecture V2 §5.6, §6.3; RB-01 · STAT; RB-04 · VAL; P2-01..09."

# ---- execution ------------------------------------------------------------
D="$SRC/execution"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Execution domain model — paper-first, token-gated, deterministic execution (definitions only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, KnowledgeTime, Ref

# --- Value Objects ---------------------------------------------------------


class ExecutionMode(Enum):
    PAPER = "paper"  # default (DEP-1)
    LIVE = "live"    # only under a valid governance authorization token
    HALT = "halt"


@dataclass(frozen=True, slots=True)
class AuthorizationToken:
    """A time-boxed governance authorization token required for live execution (RS-4)."""

    id: str
    expires_at: KnowledgeTime


@dataclass(frozen=True, slots=True)
class ParityReport:
    """Research-to-production parity check outcome (P3-15)."""

    within_tolerance: bool


@dataclass(frozen=True, slots=True)
class Fill:
    """A recorded fill (descriptive)."""

    quantity: float
    price: float


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Order(AggregateRoot):
    """An order (aggregate root); executed deterministically, paper by default."""

    portfolio: Ref  # -> portfolio.Portfolio
    mode: ExecutionMode


@dataclass(eq=False)
class PositionLedgerEntry(AggregateRoot):
    """An append-only position-ledger entry supporting reconciliation."""

    fill: Fill
PY

cat > "$D/events.py" <<'PY'
"""Execution domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExecutionAuthorized(DomainEvent):
    """Live execution was authorized by a valid, time-boxed governance token (canonical, RS-4)."""

    order_id: EntityId
    authorization_token: str


@dataclass(frozen=True, slots=True)
class FillRecorded(DomainEvent):
    """A fill was recorded to the position ledger."""

    order_id: EntityId


@dataclass(frozen=True, slots=True)
class ParityBreachDetected(DomainEvent):
    """A research-to-production parity breach was detected and blocks execution (P3-15)."""

    order_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Execution authority, parity, and reconciliation interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import AuthorizationToken, Order, ParityReport


class OrderRepository(Protocol):
    """Append-only repository of orders."""

    def get(self, id: EntityId) -> Order: ...
    def add(self, order: Order) -> None: ...


class ExecutionAuthority(Protocol):
    """Interface: deterministic execution; live is impossible without a valid token (RS-4, AI-1).

    An LLM MUST NEVER decide or authorize execution.
    """

    def execute(self, order: EntityId, token: AuthorizationToken | None) -> None: ...


class ParityHarness(Protocol):
    """Interface: research-to-production parity check (P3-15)."""

    def check(self, order: EntityId) -> ParityReport: ...


class ReconciliationService(Protocol):
    """Interface: reconciles the position ledger against reality. No logic here."""

    def reconcile(self) -> bool: ...
PY

cat > "$D/errors.py" <<'PY'
"""Execution domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class UnauthorizedExecution(DomainError):
    """Live execution attempted without a valid authorization token (RS-4, FB-12)."""


class AIExecutionAttempt(DomainError):
    """An AI attempted to execute or authorize execution (AI-1, FB-1)."""


class ParityBreach(DomainError):
    """A research-to-production parity breach blocks execution (P3-15)."""


class IrreversibleDeployment(DomainError):
    """A deployment that cannot be safely unwound (DEP-3)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Execution bounded context — paper-first, token-gated, deterministic execution."""
from __future__ import annotations

from .contracts import ExecutionAuthority, OrderRepository, ParityHarness, ReconciliationService
from .errors import AIExecutionAttempt, IrreversibleDeployment, ParityBreach, UnauthorizedExecution
from .events import ExecutionAuthorized, FillRecorded, ParityBreachDetected
from .model import (
    AuthorizationToken,
    ExecutionMode,
    Fill,
    Order,
    ParityReport,
    PositionLedgerEntry,
)

__all__ = [
    "ExecutionMode", "AuthorizationToken", "ParityReport", "Fill",
    "Order", "PositionLedgerEntry",
    "ExecutionAuthorized", "FillRecorded", "ParityBreachDetected",
    "OrderRepository", "ExecutionAuthority", "ParityHarness", "ReconciliationService",
    "UnauthorizedExecution", "AIExecutionAttempt", "ParityBreach", "IrreversibleDeployment",
]
PY
dreadme "$D" "Execution" \
"Model paper-first, token-gated, deterministic execution: orders, authorization tokens, parity, fills, position ledger, and reconciliation." \
"Model execution mode (paper default), the time-boxed authorization token, parity reports, and the position ledger." \
"Execution is deterministic and paper by default; live requires a valid token; the same engine runs backtest/paper/live differing only by injected clock and adapter." \
"Consumes Portfolio; gated by Risk (halt) and Governance (authorization token); feeds Monitoring." \
"OrderRepository (append-only); ExecutionAuthority, ParityHarness, ReconciliationService (interfaces); events ExecutionAuthorized, FillRecorded, ParityBreachDetected." \
"MUST NOT execute without authorization; MUST NOT let AI decide/authorize execution; MUST NOT deploy irreversibly." \
"CLAUDE.md (RS-4, DEP-1..4, AI-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; Execution Governance; P3-15."

# ---- workflow -------------------------------------------------------------
D="$SRC/workflow"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Workflow domain model — states, transitions, and gates (orchestrate, never adjudicate)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, VersionedId

# --- Value Objects ---------------------------------------------------------


class WorkflowState(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    ESCALATED = "escalated"


@dataclass(frozen=True, slots=True)
class TransitionSpec:
    """A declared transition with pre/postconditions; undeclared transitions are PROHIBITED (WFC-16)."""

    from_state: WorkflowState
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class GateResult:
    """The outcome of a gate; the gate delegates to a deterministic engine or human (WCON-2)."""

    passed: bool
    gate: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class WorkflowDefinition(AggregateRoot):
    """A versioned workflow contract definition (aggregate root)."""

    definition_id: VersionedId
    transitions: tuple[TransitionSpec, ...]


@dataclass(eq=False)
class WorkflowInstance(AggregateRoot):
    """A running workflow instance with an explicit owner and current state."""

    definition: VersionedId
    state: WorkflowState
PY

cat > "$D/events.py" <<'PY'
"""Workflow domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId

from .model import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowStarted(DomainEvent):
    """A workflow instance started."""

    instance_id: EntityId


@dataclass(frozen=True, slots=True)
class StageTransitioned(DomainEvent):
    """A declared transition occurred with its gate satisfied (WFC-16)."""

    instance_id: EntityId
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowCompleted(DomainEvent):
    """A workflow reached COMPLETED with all gates and approvals satisfied (canonical, AV2-18)."""

    instance_id: EntityId


@dataclass(frozen=True, slots=True)
class WorkflowEscalated(DomainEvent):
    """A workflow escalated; integrity/isolation/security escalations halt and reach GRC (WFC-41)."""

    instance_id: EntityId
PY

cat > "$D/contracts.py" <<'PY'
"""Workflow engine, gate-evaluator, and compensator interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import GateResult, WorkflowInstance


class WorkflowInstanceRepository(Protocol):
    """Append-only repository of workflow instances (immutable run history)."""

    def get(self, id: EntityId) -> WorkflowInstance: ...
    def add(self, instance: WorkflowInstance) -> None: ...


class RunLedger(Protocol):
    """Append-only run ledger recording every workflow run (WCON-3, OB-1)."""

    def record(self, instance: EntityId) -> None: ...


class WorkflowEngine(Protocol):
    """Interface: orchestrates transitions; it NEVER adjudicates (WCON-2, AV2-18)."""

    def advance(self, instance: EntityId) -> None: ...


class GateEvaluator(Protocol):
    """Interface: delegates a gate to its owning deterministic engine or human approver."""

    def evaluate(self, instance: EntityId, gate: str) -> GateResult: ...


class Compensator(Protocol):
    """Interface: saga compensation so partial failures leave consistent state (WFC-19, RE-1)."""

    def compensate(self, instance: EntityId) -> None: ...
PY

cat > "$D/errors.py" <<'PY'
"""Workflow domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class UndeclaredTransition(DomainError):
    """An out-of-band state change not in the workflow's declared transitions (WFC-16)."""


class StageSkipped(DomainError):
    """A stage was skipped (e.g., research moved directly to production) (WFC-3)."""


class GateBypassed(DomainError):
    """A transition bypassed its mandatory validation/approval gate (AV2-18)."""


class InconsistentState(DomainError):
    """A failed multi-step transition left inconsistent state (WFC-19, RE-1)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Workflow bounded context — states, transitions, and gates (orchestrate, never adjudicate)."""
from __future__ import annotations

from .contracts import (
    Compensator,
    GateEvaluator,
    RunLedger,
    WorkflowEngine,
    WorkflowInstanceRepository,
)
from .errors import GateBypassed, InconsistentState, StageSkipped, UndeclaredTransition
from .events import StageTransitioned, WorkflowCompleted, WorkflowEscalated, WorkflowStarted
from .model import (
    GateResult,
    TransitionSpec,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowState,
)

__all__ = [
    "WorkflowState", "TransitionSpec", "GateResult",
    "WorkflowDefinition", "WorkflowInstance",
    "WorkflowStarted", "StageTransitioned", "WorkflowCompleted", "WorkflowEscalated",
    "WorkflowInstanceRepository", "RunLedger", "WorkflowEngine", "GateEvaluator", "Compensator",
    "UndeclaredTransition", "StageSkipped", "GateBypassed", "InconsistentState",
]
PY
dreadme "$D" "Workflow" \
"Model the states, transitions, and gates through which all critical work moves; workflows orchestrate and never adjudicate." \
"Model the universal state machine, declared transitions with pre/postconditions, gate results, and the immutable run ledger." \
"Orchestrates only; every gate delegates to its owning deterministic engine or human; no completion without the mandatory gate; no stage-skipping." \
"Coordinates Agents, deterministic engines, and Governance; realizes the staged research-to-production chain." \
"WorkflowInstanceRepository, RunLedger; WorkflowEngine, GateEvaluator, Compensator (interfaces); events WorkflowStarted, StageTransitioned, WorkflowCompleted, WorkflowEscalated." \
"MUST NOT contain decision logic; MUST NOT permit undeclared transitions; MUST NOT skip a gate; MUST NOT leave inconsistent state on failure." \
"CLAUDE.md (WCON-1..3, RE-1); Architecture V2 §5.4; Workflow Contracts (Tier-5); P5-05."

# ---- agent ----------------------------------------------------------------
D="$SRC/agent"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Agent domain model — registered, contract-bound, advisory-only AI agents (definitions only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Authority, Provenance

# --- Value Objects ---------------------------------------------------------


@dataclass(frozen=True, slots=True)
class AgentId:
    """Stable registry identifier of the form AGT-<CAT>-<nnn> (REG-8)."""

    value: str


class TrustLevel(Enum):
    U = "U"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"  # only T2/T3 operate in production (AIGOV-12)


class RegistryState(Enum):
    PROPOSED = "proposed"
    REVIEWED = "reviewed"
    CERTIFIED = "certified"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    RETIRED = "retired"


@dataclass(frozen=True, slots=True)
class ModelPin:
    """A pinned model binding; use of an unpinned/'latest' model is PROHIBITED (AI-6, P4-01)."""

    model_id: str
    version: str


@dataclass(frozen=True, slots=True)
class PromptVersion:
    """A versioned prompt artifact with a recorded hash (PE-1)."""

    version: str
    prompt_hash: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class AgentRegistration(AggregateRoot):
    """An agent's registry entry (aggregate root); authority is propose/narrate, never decide."""

    agent_id: AgentId
    authority: Authority  # MUST be PROPOSE or NARRATE (REG-9)
    trust: TrustLevel
    state: RegistryState
    model: ModelPin
    prompt: PromptVersion


@dataclass(frozen=True, slots=True)
class AgentOutput:
    """An advisory agent output, recorded with provenance; never a decision (AI-8, APR-2)."""

    provenance: Provenance
    summary: str
PY

cat > "$D/events.py" <<'PY'
"""Agent domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class AgentCertified(DomainEvent):
    """An agent passed the eval gate and was certified (REG-15, P4-01)."""

    agent_id: EntityId


@dataclass(frozen=True, slots=True)
class AgentSuspended(DomainEvent):
    """An agent was suspended (overreach/drift/incident/isolation breach) (REG-16)."""

    agent_id: EntityId


@dataclass(frozen=True, slots=True)
class AgentOutputRecorded(DomainEvent):
    """An advisory agent output was recorded with provenance (AI-8)."""

    agent_id: EntityId
    output_hash: str
PY

cat > "$D/contracts.py" <<'PY'
"""Agent registry, model-registry, and authority-policy interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import AgentRegistration, ModelPin


class AgentRegistryPort(Protocol):
    """Interface to the deterministic Agent Registry; agents cannot edit their own entry (REG-22)."""

    def get(self, id: EntityId) -> AgentRegistration: ...
    def add(self, registration: AgentRegistration) -> None: ...


class ModelRegistryPort(Protocol):
    """Interface to the Model Registry; only pinned models may run (AI-6, P4-01)."""

    def is_pinned(self, model: ModelPin) -> bool: ...


class AgentAuthorityPolicy(Protocol):
    """Interface: deterministic policy enforcing propose/narrate ceilings (AI-1..4, REG-9)."""

    def is_permitted(self, agent: EntityId, action: str) -> bool: ...


class IsolationPolicy(Protocol):
    """Interface: deterministic policy enforcing the generator-vs-validator air-gap (P2-07)."""

    def may_access(self, agent: EntityId, resource: str) -> bool: ...
PY

cat > "$D/errors.py" <<'PY'
"""Agent domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class DecideAuthorityForbidden(DomainError):
    """An agent was assigned or attempted 'decide' authority (REG-9, AI-1..4)."""


class SelfEscalation(DomainError):
    """An agent attempted to change its own registry entry or increase its authority (REG-22/23)."""


class UnpinnedModel(DomainError):
    """An agent attempted to run an unpinned or 'latest' model (AI-6)."""


class UnregisteredAgent(DomainError):
    """An unregistered agent attempted to operate (REG-1)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Agent bounded context — registered, contract-bound, advisory-only AI agents."""
from __future__ import annotations

from .contracts import AgentAuthorityPolicy, AgentRegistryPort, IsolationPolicy, ModelRegistryPort
from .errors import DecideAuthorityForbidden, SelfEscalation, UnpinnedModel, UnregisteredAgent
from .events import AgentCertified, AgentOutputRecorded, AgentSuspended
from .model import (
    AgentId,
    AgentOutput,
    AgentRegistration,
    ModelPin,
    PromptVersion,
    RegistryState,
    TrustLevel,
)

__all__ = [
    "AgentId", "TrustLevel", "RegistryState", "ModelPin", "PromptVersion",
    "AgentRegistration", "AgentOutput",
    "AgentCertified", "AgentSuspended", "AgentOutputRecorded",
    "AgentRegistryPort", "ModelRegistryPort", "AgentAuthorityPolicy", "IsolationPolicy",
    "DecideAuthorityForbidden", "SelfEscalation", "UnpinnedModel", "UnregisteredAgent",
]
PY
dreadme "$D" "Agent" \
"Model registered, contract-bound, advisory-only AI agents: registry entries, model pins, prompt versions, and authority ceilings." \
"Model agent registration, trust level, lifecycle state, model pin, and outputs; every agent is propose/narrate only and model-pinned." \
"AI is advisory; no agent holds decision authority; agents cannot edit their own entry or escalate authority; generators cannot access OOS/validation." \
"Mirrors the AI Agent Registry; participates in Workflows; defers to the deterministic engines it narrates." \
"AgentRegistryPort, ModelRegistryPort; AgentAuthorityPolicy, IsolationPolicy (interfaces); events AgentCertified, AgentSuspended, AgentOutputRecorded." \
"MUST NOT hold or attempt decide authority; MUST NOT self-edit/self-escalate; MUST NOT run an unpinned model; MUST NOT breach isolation." \
"CLAUDE.md (AI-1..8, AG-1..4); Architecture V2 §5.3; RB-15 · AIGOV; Agent Registry; Agent Contracts; P4-01/02, P2-07."

# ---- governance -----------------------------------------------------------
D="$SRC/governance"; mkdir -p "$D"
cat > "$D/model.py" <<'PY'
"""Governance domain model — human approvals, tokens, overrides, and the tamper-evident audit."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import ActorRef, AggregateRoot, KnowledgeTime, Ref

# --- Value Objects ---------------------------------------------------------


class ApprovalDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class Rationale:
    """The written rationale required for an override/approval (HO-2)."""

    text: str


@dataclass(frozen=True, slots=True)
class CounterSignature:
    """An independent counter-signature required for capital-affecting approvals (HO-2)."""

    signer: ActorRef


@dataclass(frozen=True, slots=True)
class CapitalEligibilityToken:
    """The canonical governance artifact certifying scientific eligibility (P2-09).

    Issued by the scientific gate; referenced by Strategy/Portfolio.
    """

    id: str
    subject: Ref  # -> strategy.Strategy
    issued_at: KnowledgeTime


@dataclass(frozen=True, slots=True)
class AuditChainEntry:
    """A hash-chained, tamper-evident audit record (SEC-4, CP-7)."""

    prev_hash: str
    entry_hash: str
    actor: ActorRef


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Approval(AggregateRoot):
    """A recorded human approval at a governance gate (aggregate root, HO-2)."""

    subject: Ref
    decision: ApprovalDecision
    approver: ActorRef
    counter_signature: CounterSignature | None
    rationale: Rationale


@dataclass(eq=False)
class Override(AggregateRoot):
    """A recorded human override; MUST NOT bypass statistical/risk controls (HO-3)."""

    subject: Ref
    approver: ActorRef
    rationale: Rationale
PY

cat > "$D/events.py" <<'PY'
"""Governance domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ProductionDeploymentApproved(DomainEvent):
    """A production deployment was approved (counter-signed for capital) (HO-2, AV2-15)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class OverrideRecorded(DomainEvent):
    """A human override was recorded with identity, timestamp, and rationale (HO-2)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class GovernanceHalt(DomainEvent):
    """Governance halted an automated process (HO-1, kill-switch authority)."""

    reason: str
PY

cat > "$D/contracts.py" <<'PY'
"""Governance approval-engine, audit-trail, and tiered-autonomy interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Approval, AuditChainEntry


class ApprovalRepository(Protocol):
    """Append-only repository of human approvals (immutable audit)."""

    def get(self, id: EntityId) -> Approval: ...
    def add(self, approval: Approval) -> None: ...


class AuditTrail(Protocol):
    """Append-only, tamper-evident (hash-chained) audit trail (SEC-4, CP-7)."""

    def append(self, entry: AuditChainEntry) -> None: ...


class ApprovalEngine(Protocol):
    """Interface: routes critical transitions to human approvers; an override defeating a control is void (HO-3)."""

    def request_approval(self, subject: EntityId) -> None: ...


class TieredAutonomyPolicy(Protocol):
    """Interface: scales human oversight without rubber-stamping (P5-05, SC-4)."""

    def required_tier(self, subject: EntityId) -> str: ...
PY

cat > "$D/errors.py" <<'PY'
"""Governance domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class MissingCounterSignature(DomainError):
    """A capital-affecting approval lacks an independent counter-signature (HO-2)."""


class AIOverrideAttempt(DomainError):
    """An AI attempted to override a human governance decision (HO-1, AI-4)."""


class ControlBypassOverride(DomainError):
    """A human override attempted to bypass statistical/risk enforcement; it is void (HO-3)."""


class UnauthorizedApproval(DomainError):
    """An actor approved something they have no authority to approve (CP-5, HO-1)."""
PY

cat > "$D/__init__.py" <<'PY'
"""Governance bounded context — human approvals, tokens, overrides, and the tamper-evident audit."""
from __future__ import annotations

from .contracts import ApprovalEngine, ApprovalRepository, AuditTrail, TieredAutonomyPolicy
from .errors import (
    AIOverrideAttempt,
    ControlBypassOverride,
    MissingCounterSignature,
    UnauthorizedApproval,
)
from .events import GovernanceHalt, OverrideRecorded, ProductionDeploymentApproved
from .model import (
    Approval,
    ApprovalDecision,
    AuditChainEntry,
    CapitalEligibilityToken,
    CounterSignature,
    Override,
    Rationale,
)

__all__ = [
    "ApprovalDecision", "Rationale", "CounterSignature", "CapitalEligibilityToken",
    "AuditChainEntry", "Approval", "Override",
    "ProductionDeploymentApproved", "OverrideRecorded", "GovernanceHalt",
    "ApprovalRepository", "AuditTrail", "ApprovalEngine", "TieredAutonomyPolicy",
    "MissingCounterSignature", "AIOverrideAttempt", "ControlBypassOverride", "UnauthorizedApproval",
]
PY
dreadme "$D" "Governance" \
"Model human accountability: approvals, counter-signatures, capital-eligibility tokens, overrides, and the tamper-evident hash-chained audit trail." \
"Model approvals and overrides (with identity, timestamp, rationale), the canonical capital-eligibility token, and audit-chain entries." \
"Humans approve and are accountable; AI may never override a human governance decision; overrides that defeat controls are void." \
"Approves Execution deployment; issues/holds capital-eligibility tokens referenced by Strategy/Portfolio; records everything in the audit trail." \
"ApprovalRepository, AuditTrail (append-only); ApprovalEngine, TieredAutonomyPolicy (interfaces); events ProductionDeploymentApproved, OverrideRecorded, GovernanceHalt." \
"MUST NOT let AI override a human decision; MUST NOT approve capital without counter-sign; MUST NOT use an override to bypass statistical/risk controls." \
"CLAUDE.md (HO-1..4, CP-5/7, SEC-4); Architecture V2 §5.1, §6.2; RB-13 · RISK; ADR Governance; P2-09, P5-05."

echo "Core Domain Foundation generated."
