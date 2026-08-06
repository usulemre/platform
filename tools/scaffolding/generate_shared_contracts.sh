#!/usr/bin/env bash
#
# generate_shared_contracts.sh — Phase 1.2 Shared Contracts Foundation generator.
#
# Governed by: CLAUDE.md; Architecture V2 §5.10 (Contracts Spine); Implementation Roadmap Phase 1;
#              IMP-10/11 (contract-first, interface stability); RB-20 · CODE; TDR (Python, stdlib-only).
#
# Emits the canonical contract layer under packages/contracts as the Python package
# `platform_contracts`: commands, queries, events, requests/responses, DTOs, policies,
# specifications, validation contracts, error contracts, repository contracts, and service
# contracts for the 13 bounded contexts. Contracts are IMMUTABLE (frozen), technology- and
# framework-independent (stdlib only), self-contained (dependency-free — the stable integration
# waist), deterministic (no ambient time/RNG), and versionable (every message carries a schema
# version). It contains NO business logic, NO persistence, NO API, NO infrastructure. Idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/contracts"
SRC="$PKG/src/platform_contracts"
cd "$ROOT"

# ---------------------------------------------------------------------------
# helper: per-module README (args must contain no $ or backticks)
# ---------------------------------------------------------------------------
creadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 interfaces 6 deps 7 boundaries 8 forbidden 9 domains 10 gov
  cat > "$1/README.md" <<EOF
# contracts · $2 module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose
$3

## Responsibilities
$4

## Public Interfaces
$5

## Dependencies
platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries
Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains
$9

## Forbidden Responsibilities
$8

## Related Governance Documents
$10
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# contracts — the canonical, immutable, technology-independent contract layer (Phase 1.2).
# Self-contained: standard library only, NO runtime dependencies (the stable integration waist).
[project]
name = "platform-contracts"
version = "0.1.0"
description = "Canonical inter-context contracts: commands, queries, events, DTOs, and interfaces."
requires-python = ">=3.12"
dependencies = []            # intentionally empty — contracts depend on nothing (stability, IMP-11)

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_contracts"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# contracts — implemented in Phase 1.2

This package now contains the Shared Contracts Foundation (the `platform_contracts` package). See
README.md and the per-context modules under `src/platform_contracts/`. Contracts are immutable and
carry a schema version; business logic, persistence, APIs, and infrastructure remain forbidden here.
MD

cat > "$SRC/__init__.py" <<'PY'
"""platform_contracts — the canonical, immutable contract layer (the Contracts Spine).

Defines the formal, versioned messages exchanged between domains, services, workflows, AI agents,
and deterministic engines: Commands, Queries, Events, Requests, Responses, DTOs, plus the interface
contracts (Repository, Service), Policies, Specifications, Validation contracts, and Error contracts.

Stability contract (IMP-10/11, VER-1/2):
    * standard library only — no third-party, framework, infrastructure, persistence, or AI;
    * self-contained — depends on no other package, not even the domain model, so it is the stable
      integration waist (mapping between contract DTOs and domain objects lives in an outer layer);
    * immutable — every contract type is a frozen value; consumers never mutate a message;
    * versioned — every message carries a ``ContractMeta.schema_version`` (breaking changes bump
      major and preserve historical artifacts);
    * deterministic — time is supplied on the envelope, never read here (CS-3, PIT-4);
    * asset-agnostic — no asset-class branching (CP-8).
"""
from . import common

__all__ = [
    "common",
    "research", "dataset", "experiment", "feature", "signal", "strategy",
    "portfolio", "risk", "validation", "execution", "workflow", "agent", "governance",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# COMMON — the contract kernel
# ===========================================================================
mkdir -p "$SRC/common"

cat > "$SRC/common/versioning.py" <<'PY'
"""Contract versioning primitives (VER-1/2: breaking changes bump major)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SchemaVersion:
    """Semantic version of a contract schema."""

    major: int
    minor: int
    patch: int
PY

cat > "$SRC/common/ids.py" <<'PY'
"""Opaque identity references carried across contract boundaries (never domain objects, SE-2)."""
from __future__ import annotations

from dataclasses import dataclass

from .versioning import SchemaVersion


@dataclass(frozen=True, slots=True)
class Id:
    """An opaque identity reference to an aggregate in some bounded context."""

    value: str


@dataclass(frozen=True, slots=True)
class VersionTag:
    """A name + version that immutably denotes one artifact version (NM-2, VER-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class ContentHash:
    """Content-addressed reference to an immutable artifact (CP-2, P1-02)."""

    algorithm: str
    digest: str


@dataclass(frozen=True, slots=True)
class CorrelationId:
    """Correlates messages across a workflow/run for traceability (CP-7)."""

    value: str
PY

cat > "$SRC/common/authority.py" <<'PY'
"""Authority as contract-level enums (mirrors the authority spine; independent of the domain)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AuthorityLevel(Enum):
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
    """Who issued a message and the authority they hold (CP-5, HO-1). AI is never DECIDE/APPROVE."""

    id: str
    kind: ActorKind
    authority: AuthorityLevel
PY

cat > "$SRC/common/envelope.py" <<'PY'
"""The envelope carried by every contract message (identity, version, causation, actor, time)."""
from __future__ import annotations

from dataclasses import dataclass

from .authority import ActorRef
from .ids import CorrelationId, Id
from .versioning import SchemaVersion


@dataclass(frozen=True, slots=True)
class ContractMeta:
    """Immutable metadata on every command/query/event/request/response.

    ``occurred_at`` is an ISO-8601 string supplied by an injected clock, never read here (CS-3).
    """

    message_id: Id
    schema_version: SchemaVersion
    correlation_id: CorrelationId
    occurred_at: str
    actor: ActorRef
"PY_PLACEHOLDER"
PY

# fix accidental marker (defensive no-op; ensures file ends cleanly)
sed -i.bak '/"PY_PLACEHOLDER"/d' "$SRC/common/envelope.py" && rm -f "$SRC/common/envelope.py.bak"

cat > "$SRC/common/base.py" <<'PY'
"""Base marker types for contract messages. All are immutable (frozen); none carry behavior."""
from __future__ import annotations

from dataclasses import dataclass

from .envelope import ContractMeta


class Dto:
    """Marker base for a pure data-transfer object (no envelope, no behavior)."""

    __slots__ = ()


@dataclass(frozen=True, slots=True)
class Command:
    """An imperative request to a deterministic engine/service. A command never decides itself."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Query:
    """A read request. Historical reads carry an as-of on the concrete query (PIT-1)."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Event:
    """A past-tense, immutable fact published after a state change (a record, not a command)."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Request:
    """A synchronous request message to a service contract."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Response:
    """A synchronous response message from a service contract."""

    meta: ContractMeta
PY

cat > "$SRC/common/errors.py" <<'PY'
"""Canonical error contracts — the structured error shape exchanged between components.

These are DATA contracts (DTOs), not exceptions; each category maps to a constitutional invariant.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .base import Dto


class ErrorCategory(Enum):
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    INVARIANT = "invariant"
    AUTHORITY = "authority"                      # AI-1..4, HO-1
    SEPARATION_OF_POWERS = "separation_of_powers"  # CP-5
    POINT_IN_TIME = "point_in_time"              # PIT-1..4
    ISOLATION_BARRIER = "isolation_barrier"      # AD-3, P2-07
    REPRODUCIBILITY = "reproducibility"          # CP-4, RP-2
    IMMUTABILITY = "immutability"                # CP-2
    PROVENANCE = "provenance"                    # CP-6, DP-3
    VALIDATION = "validation"                    # structural, not statistical
    UNAUTHORIZED = "unauthorized"


@dataclass(frozen=True, slots=True)
class ErrorContract(Dto):
    """A structured, immutable error carried across a contract boundary."""

    code: str
    category: ErrorCategory
    message: str
PY

cat > "$SRC/common/validation.py" <<'PY'
"""Validation contracts — STRUCTURAL validation only (never statistical significance, AI-2)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, TypeVar

from .base import Dto

TCandidate = TypeVar("TCandidate", contravariant=True)


@dataclass(frozen=True, slots=True)
class Violation(Dto):
    """A single structural rule violation."""

    field: str
    rule: str
    detail: str


@dataclass(frozen=True, slots=True)
class ValidationResult(Dto):
    """The immutable outcome of validating a message/DTO against its schema/rules."""

    valid: bool
    violations: tuple[Violation, ...]


class ValidationContract(Protocol[TCandidate]):
    """Interface: structural validation of a contract message. No logic in the contract layer."""

    def validate(self, candidate: TCandidate) -> ValidationResult: ...
PY

cat > "$SRC/common/patterns.py" <<'PY'
"""Base interface patterns for Policies, Specifications, Repository and Service contracts."""
from __future__ import annotations

from typing import Protocol, TypeVar

from .ids import Id

T = TypeVar("T")
TCandidate = TypeVar("TCandidate", contravariant=True)


class Policy(Protocol):
    """Marker for a deterministic, versioned policy contract (behavior lives in an engine)."""

    ...


class Specification(Protocol[TCandidate]):
    """A deterministic, testable predicate contract (DE-1). Interface only."""

    def is_satisfied_by(self, candidate: TCandidate) -> bool: ...


class RepositoryContract(Protocol[T]):
    """Read/append contract for immutable, versioned artifacts (add + supersede, never mutate)."""

    def get(self, id: Id) -> T: ...
    def add(self, item: T) -> None: ...


class ServiceContract(Protocol):
    """Marker for a stateless service contract (a set of request/response operations)."""

    ...
PY

cat > "$SRC/common/__init__.py" <<'PY'
"""platform_contracts.common — the contract kernel every module depends on."""
from __future__ import annotations

from .authority import ActorKind, ActorRef, AuthorityLevel
from .base import Command, Dto, Event, Query, Request, Response
from .envelope import ContractMeta
from .errors import ErrorCategory, ErrorContract
from .ids import ContentHash, CorrelationId, Id, VersionTag
from .patterns import Policy, RepositoryContract, ServiceContract, Specification
from .validation import ValidationContract, ValidationResult, Violation
from .versioning import SchemaVersion

__all__ = [
    "SchemaVersion",
    "Id", "VersionTag", "ContentHash", "CorrelationId",
    "AuthorityLevel", "ActorKind", "ActorRef",
    "ContractMeta",
    "Dto", "Command", "Query", "Event", "Request", "Response",
    "ErrorCategory", "ErrorContract",
    "ValidationContract", "ValidationResult", "Violation",
    "Policy", "Specification", "RepositoryContract", "ServiceContract",
]
PY

cat > "$SRC/common/README.md" <<'MD'
# contracts · common (contract kernel)

> **Phase 1.2 — contract primitives.** Immutable, stdlib-only, dependency-free.

## Purpose
The shared kernel every contract module depends on: identity references (Id, VersionTag,
ContentHash, CorrelationId), the SchemaVersion (versionability), the authority enums, the
ContractMeta envelope (identity + version + causation + actor + supplied time), the base message
markers (Command, Query, Event, Request, Response, Dto), the canonical ErrorContract + ErrorCategory,
the structural ValidationContract, and the base Policy/Specification/Repository/Service patterns.

## Boundaries
Depends on nothing (innermost, dependency-free). All contract modules depend on it. Immutable;
deterministic (time supplied on the envelope, never read).

## Related Governance Documents
CLAUDE.md (CP-2/4/5/6/7/8, NM-2, PIT-1..4, CS-3, VER-1/2); Architecture V2 §5.10; IMP-10/11;
RB-20 · CODE; Technology Decision Record §11 (API strategy).
MD

# ===========================================================================
# CONTRACT MODULE GENERATOR
# ===========================================================================
# Per module: __init__.py, messages.py (Commands/Queries/Requests/Responses/DTOs),
#             events.py (Event contracts), interfaces.py (Repository/Service/Policy/Spec/Validation
#             contracts), errors.py (Error contracts / codes), README.md.

mod_init() {
  # $1 dir  $2 module-title
  cat > "$1/__init__.py" <<EOF
"""$2 bounded-context contracts (Phase 1.2). Immutable, versioned, technology-independent."""
from __future__ import annotations

from platform_contracts.common import SchemaVersion

from . import errors, events, interfaces, messages

SCHEMA_VERSION = SchemaVersion(1, 0, 0)  # contract schema version for this module (VER-1)

__all__ = ["messages", "events", "interfaces", "errors", "SCHEMA_VERSION"]
EOF
}

# ---- research -------------------------------------------------------------
D="$SRC/research"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Research contracts — Commands, Queries, Requests, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response

# --- DTOs ------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class HypothesisDto(Dto):
    id: Id
    idea_id: Id
    pre_registered: bool


# --- Commands --------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterIdea(Command):
    title: str
    economic_rationale: str


@dataclass(frozen=True, slots=True)
class PreRegisterHypothesis(Command):
    """Freeze the falsifiable prediction and success criteria (one-way lock, SM-2)."""

    hypothesis_id: Id
    prediction: str
    success_criteria: str


# --- Queries ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class GetHypothesis(Query):
    hypothesis_id: Id


# --- Responses -------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterIdeaResponse(Response):
    idea_id: Id


@dataclass(frozen=True, slots=True)
class GetHypothesisResponse(Response):
    hypothesis: HypothesisDto
PY
cat > "$D/events.py" <<'PY'
"""Research event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ResearchCreated(Event):
    """Canonical event: a new idea/research effort was registered."""

    idea_id: Id
    title: str


@dataclass(frozen=True, slots=True)
class HypothesisPreRegistered(Event):
    hypothesis_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Research repository, service, policy, and validation contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id, Policy, ValidationContract

from .messages import (
    GetHypothesis,
    GetHypothesisResponse,
    HypothesisDto,
    PreRegisterHypothesis,
    RegisterIdea,
    RegisterIdeaResponse,
)


class ResearchRepositoryContract(Protocol):
    def get(self, id: Id) -> HypothesisDto: ...
    def add(self, hypothesis: HypothesisDto) -> None: ...


class ResearchServiceContract(Protocol):
    def register_idea(self, command: RegisterIdea) -> RegisterIdeaResponse: ...
    def pre_register(self, command: PreRegisterHypothesis) -> None: ...
    def get_hypothesis(self, query: GetHypothesis) -> GetHypothesisResponse: ...


class PreRegistrationPolicy(Policy, Protocol):
    """Deterministic policy: pre-registration is a one-way lock (SM-2)."""


class HypothesisValidationContract(ValidationContract[PreRegisterHypothesis], Protocol):
    """Structural validation of a pre-registration command (not statistical)."""
PY
cat > "$D/errors.py" <<'PY'
"""Research error contracts."""
from __future__ import annotations

from enum import Enum


class ResearchErrorCode(Enum):
    PRE_REGISTRATION_LOCKED = "research.pre_registration_locked"  # p-hacking (FB-8)
    NOT_FALSIFIABLE = "research.not_falsifiable"                  # SM-1
    UNREGISTERED_IDEA = "research.unregistered_idea"
PY
mod_init "$D" "Research"
creadme "$D" "Research" \
"Define the contracts for the research lifecycle: registering ideas and pre-registering falsifiable hypotheses." \
"Carry commands (RegisterIdea, PreRegisterHypothesis), the GetHypothesis query, the ResearchCreated event, and hypothesis DTOs; expose repository/service interfaces." \
"ResearchRepositoryContract, ResearchServiceContract, PreRegistrationPolicy, HypothesisValidationContract; events ResearchCreated, HypothesisPreRegistered." \
"n/a" \
"n/a" \
"MUST NOT carry validation/promotion logic; MUST NOT let a command adjudicate significance; MUST NOT expose OOS." \
"core-domain research context; Experiment and Feature contracts." \
"CLAUDE.md (SM-1..5, AD-2/3); Architecture V2 §5.5, §5.10; RB-02 · RMET; Experiment Tracking Governance."

# ---- dataset --------------------------------------------------------------
D="$SRC/dataset"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Dataset contracts — Commands, Queries (as-of), Requests, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response

# --- DTOs ------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class DatasetDto(Dto):
    id: Id
    certified: bool


@dataclass(frozen=True, slots=True)
class DataQualityReportDto(Dto):
    passed: bool
    summary: str


# --- Commands --------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterDataset(Command):
    name: str


@dataclass(frozen=True, slots=True)
class CertifyDataset(Command):
    dataset_id: Id


@dataclass(frozen=True, slots=True)
class RecordVintage(Command):
    """Record a restatement as a NEW vintage; overwrites are PROHIBITED (DI-3)."""

    dataset_id: Id


# --- Queries ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ReadAsOf(Query):
    """A point-in-time read; the as-of is mandatory (PIT-1, fail-closed)."""

    dataset_id: Id
    as_of: str  # ISO-8601 knowledge-time boundary


# --- Responses -------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class CertifyDatasetResponse(Response):
    report: DataQualityReportDto


@dataclass(frozen=True, slots=True)
class ReadAsOfResponse(Response):
    dataset: DatasetDto
PY
cat > "$D/events.py" <<'PY'
"""Dataset event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class DatasetRegistered(Event):
    dataset_id: Id


@dataclass(frozen=True, slots=True)
class DatasetValidated(Event):
    """Canonical event: a dataset passed certification and is safe for research (DI-1)."""

    dataset_id: Id


@dataclass(frozen=True, slots=True)
class VintageRecorded(Event):
    dataset_id: Id
    vintage_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Dataset repository, as-of gateway, and certification contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    CertifyDataset,
    CertifyDatasetResponse,
    DatasetDto,
    ReadAsOf,
    ReadAsOfResponse,
)


class DatasetRepositoryContract(Protocol):
    def get(self, id: Id) -> DatasetDto: ...
    def add(self, dataset: DatasetDto) -> None: ...


class AsOfGatewayContract(Protocol):
    """The sole read path for history; a read without an as-of is impossible (PIT-1, AV2-22)."""

    def read_as_of(self, query: ReadAsOf) -> ReadAsOfResponse: ...


class CertificationServiceContract(Protocol):
    def certify(self, command: CertifyDataset) -> CertifyDatasetResponse: ...
PY
cat > "$D/errors.py" <<'PY'
"""Dataset error contracts."""
from __future__ import annotations

from enum import Enum


class DatasetErrorCode(Enum):
    NON_AS_OF_READ = "dataset.non_as_of_read"          # PIT-1
    VINTAGE_OVERWRITE = "dataset.vintage_overwrite"    # DI-3
    UNCERTIFIED_EXPOSED = "dataset.uncertified_exposed"  # DI-1
    SURVIVORSHIP_UNSAFE = "dataset.survivorship_unsafe"  # FB-7
PY
mod_init "$D" "Dataset"
creadme "$D" "Dataset" \
"Define the contracts for certified, point-in-time data: registration, certification, vintages, and the mandatory as-of read." \
"Carry commands (RegisterDataset, CertifyDataset, RecordVintage), the ReadAsOf query, the DatasetValidated event, and dataset DTOs; expose the As-Of Gateway contract." \
"DatasetRepositoryContract, AsOfGatewayContract, CertificationServiceContract; events DatasetRegistered, DatasetValidated, VintageRecorded." \
"n/a" "n/a" \
"MUST NOT permit a read without an as-of; MUST NOT overwrite a vintage; MUST NOT expose uncertified/OOS data." \
"core-domain dataset context; Feature and every engine (via the As-Of Gateway)." \
"CLAUDE.md (DI-1..3, PIT-1..4); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; RB-08 · PIT; Dataset Governance."

# ---- experiment -----------------------------------------------------------
D="$SRC/experiment"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Experiment contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class TrialOutcome(Enum):
    RUN = "run"
    DISCARDED = "discarded"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class ManifestDto(Dto):
    run_manifest_id: str
    config_hash: str


@dataclass(frozen=True, slots=True)
class ExperimentDto(Dto):
    id: Id
    manifest: ManifestDto


@dataclass(frozen=True, slots=True)
class RegisterExperiment(Command):
    hypothesis_id: Id
    manifest: ManifestDto


@dataclass(frozen=True, slots=True)
class RecordTrial(Command):
    """Enroll a trial in the Trial Ledger BEFORE it runs (P2-01); every trial is counted (EX-4)."""

    experiment_id: Id
    outcome: TrialOutcome


@dataclass(frozen=True, slots=True)
class GetExperiment(Query):
    experiment_id: Id


@dataclass(frozen=True, slots=True)
class RegisterExperimentResponse(Response):
    experiment_id: Id
PY
cat > "$D/events.py" <<'PY'
"""Experiment event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ExperimentRegistered(Event):
    """Canonical event: an experiment was registered with an immutable manifest (EX-1)."""

    experiment_id: Id


@dataclass(frozen=True, slots=True)
class TrialRecorded(Event):
    experiment_id: Id
    trial_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Experiment repository, trial-ledger, and reproducibility contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import ExperimentDto, RecordTrial, RegisterExperiment, RegisterExperimentResponse


class ExperimentRepositoryContract(Protocol):
    def get(self, id: Id) -> ExperimentDto: ...
    def add(self, experiment: ExperimentDto) -> None: ...


class TrialLedgerContract(Protocol):
    """Append-only, tamper-evident ledger; enroll before run (P2-01)."""

    def append(self, command: RecordTrial) -> None: ...


class ExperimentServiceContract(Protocol):
    def register(self, command: RegisterExperiment) -> RegisterExperimentResponse: ...
PY
cat > "$D/errors.py" <<'PY'
"""Experiment error contracts."""
from __future__ import annotations

from enum import Enum


class ExperimentErrorCode(Enum):
    UNREGISTERED_EXPERIMENT = "experiment.unregistered"     # FB-5
    MANIFEST_MUTATION = "experiment.manifest_mutation"      # EX-3
    TRIAL_NOT_COUNTED = "experiment.trial_not_counted"      # EX-4
PY
mod_init "$D" "Experiment"
creadme "$D" "Experiment" \
"Define the contracts for registered experiments and the append-only Trial Ledger." \
"Carry commands (RegisterExperiment, RecordTrial), the GetExperiment query, the ExperimentRegistered event, and manifest DTOs; expose the Trial Ledger contract." \
"ExperimentRepositoryContract, TrialLedgerContract, ExperimentServiceContract; events ExperimentRegistered, TrialRecorded." \
"n/a" "n/a" \
"MUST NOT run an unregistered experiment; MUST NOT mutate a manifest; MUST NOT compute significance (that is Validation)." \
"core-domain experiment context; Research and Validation contracts." \
"CLAUDE.md (SM-5, EX-1..4, SI-1); Architecture V2 §5.5/§5.6; RB-01 · STAT; Experiment Tracking Governance."

# ---- feature --------------------------------------------------------------
D="$SRC/feature"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Feature contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class LeakageReportDto(Dto):
    clean: bool
    summary: str


@dataclass(frozen=True, slots=True)
class FeatureDto(Dto):
    id: Id
    accepted: bool


@dataclass(frozen=True, slots=True)
class ProposeFeature(Command):
    definition: str


@dataclass(frozen=True, slots=True)
class AcceptFeature(Command):
    """Accept only when leakage-clean and provenanced (FA-1..4)."""

    feature_id: Id


@dataclass(frozen=True, slots=True)
class GetFeature(Query):
    feature_id: Id


@dataclass(frozen=True, slots=True)
class AcceptFeatureResponse(Response):
    feature_id: Id
    leakage_report: LeakageReportDto
PY
cat > "$D/events.py" <<'PY'
"""Feature event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class FeatureProposed(Event):
    feature_id: Id


@dataclass(frozen=True, slots=True)
class FeatureAccepted(Event):
    """Canonical event: a feature passed the leakage harness and acceptance gate (FA-1..4)."""

    feature_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Feature repository, marketplace, and leakage-harness contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import AcceptFeature, AcceptFeatureResponse, FeatureDto


class FeatureRepositoryContract(Protocol):
    def get(self, id: Id) -> FeatureDto: ...
    def add(self, feature: FeatureDto) -> None: ...


class FeatureMarketplaceContract(Protocol):
    def get(self, id: Id) -> FeatureDto: ...


class LeakageHarnessContract(Protocol):
    """Deterministic leakage/look-ahead check; must pass before acceptance (P2-03)."""

    def accept(self, command: AcceptFeature) -> AcceptFeatureResponse: ...
PY
cat > "$D/errors.py" <<'PY'
"""Feature error contracts."""
from __future__ import annotations

from enum import Enum


class FeatureErrorCode(Enum):
    LEAKAGE_DETECTED = "feature.leakage_detected"      # P2-03
    LOOK_AHEAD_BIAS = "feature.look_ahead_bias"        # PIT-3, FB-7
    MISSING_PROVENANCE = "feature.missing_provenance"  # FB-11
PY
mod_init "$D" "Feature"
creadme "$D" "Feature" \
"Define the contracts for declarative, PIT-bound, leakage-clean features and the marketplace." \
"Carry commands (ProposeFeature, AcceptFeature), the GetFeature query, the FeatureAccepted event, and feature/leakage DTOs; expose the Leakage Harness contract." \
"FeatureRepositoryContract, FeatureMarketplaceContract, LeakageHarnessContract; events FeatureProposed, FeatureAccepted." \
"n/a" "n/a" \
"MUST NOT accept a feature that is not leakage-clean or lacks provenance; MUST NOT self-accept." \
"core-domain feature context; Dataset and Signal contracts." \
"CLAUDE.md (FA-1..4, PIT-3, DP-3); Architecture V2 §5.5/§5.8; RB-09/10 · FAR; Feature Registry."

# ---- signal ---------------------------------------------------------------
D="$SRC/signal"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Signal contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class SignalDto(Dto):
    id: Id
    net_of_cost: bool
    retired: bool


@dataclass(frozen=True, slots=True)
class RegisterSignal(Command):
    feature_id: Id
    definition: str


@dataclass(frozen=True, slots=True)
class RetireSignal(Command):
    signal_id: Id


@dataclass(frozen=True, slots=True)
class GetSignal(Query):
    signal_id: Id


@dataclass(frozen=True, slots=True)
class RegisterSignalResponse(Response):
    signal_id: Id
PY
cat > "$D/events.py" <<'PY'
"""Signal event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class SignalGenerated(Event):
    """Canonical event: a signal was generated from accepted features (net-of-cost, AD-1)."""

    signal_id: Id


@dataclass(frozen=True, slots=True)
class SignalRetired(Event):
    signal_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Signal repository and lifecycle contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import RegisterSignal, RegisterSignalResponse, RetireSignal, SignalDto


class SignalRepositoryContract(Protocol):
    def get(self, id: Id) -> SignalDto: ...
    def add(self, signal: SignalDto) -> None: ...


class SignalLifecycleServiceContract(Protocol):
    def register(self, command: RegisterSignal) -> RegisterSignalResponse: ...
    def retire(self, command: RetireSignal) -> None: ...
PY
cat > "$D/errors.py" <<'PY'
"""Signal error contracts."""
from __future__ import annotations

from enum import Enum


class SignalErrorCode(Enum):
    GROSS_SELECTION = "signal.gross_selection"                    # AD-1, AP-10
    GENERATOR_OBSERVED_VALIDATION = "signal.generator_observed_validation"  # P2-07
PY
mod_init "$D" "Signal"
creadme "$D" "Signal" \
"Define the contracts for the signal generation lifecycle (net-of-cost, isolation-respecting)." \
"Carry commands (RegisterSignal, RetireSignal), the GetSignal query, the SignalGenerated event, and signal DTOs; expose the lifecycle contract." \
"SignalRepositoryContract, SignalLifecycleServiceContract; events SignalGenerated, SignalRetired." \
"n/a" "n/a" \
"MUST NOT select on gross performance; MUST NOT observe validation/OOS outcomes (isolation barrier)." \
"core-domain signal context; Feature and Strategy contracts." \
"CLAUDE.md (AD-1..4, RL-2); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry; P2-07."

# ---- strategy -------------------------------------------------------------
D="$SRC/strategy"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Strategy contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class StrategyDto(Dto):
    id: Id
    lifecycle: str
    capital_eligibility_token: str | None  # None until issued (RG-1)


@dataclass(frozen=True, slots=True)
class RegisterStrategy(Command):
    signal_id: Id


@dataclass(frozen=True, slots=True)
class RetireStrategy(Command):
    strategy_id: Id


@dataclass(frozen=True, slots=True)
class GetStrategy(Query):
    strategy_id: Id


@dataclass(frozen=True, slots=True)
class RegisterStrategyResponse(Response):
    strategy_id: Id
PY
cat > "$D/events.py" <<'PY'
"""Strategy event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class StrategyRegistered(Event):
    strategy_id: Id


@dataclass(frozen=True, slots=True)
class StrategyApproved(Event):
    """Canonical event: a strategy passed the scientific gate and received an eligibility token."""

    strategy_id: Id
    eligibility_token: str


@dataclass(frozen=True, slots=True)
class StrategyRetired(Event):
    strategy_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Strategy repository and lifecycle contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import RegisterStrategy, RegisterStrategyResponse, RetireStrategy, StrategyDto


class StrategyRepositoryContract(Protocol):
    def get(self, id: Id) -> StrategyDto: ...
    def add(self, strategy: StrategyDto) -> None: ...


class StrategyLifecycleServiceContract(Protocol):
    def register(self, command: RegisterStrategy) -> RegisterStrategyResponse: ...
    def retire(self, command: RetireStrategy) -> None: ...
PY
cat > "$D/errors.py" <<'PY'
"""Strategy error contracts."""
from __future__ import annotations

from enum import Enum


class StrategyErrorCode(Enum):
    NOT_CAPITAL_ELIGIBLE = "strategy.not_capital_eligible"  # RG-1, FB-12
    MISSING_REPLICATION = "strategy.missing_replication"    # VS-4, P2-08
PY
mod_init "$D" "Strategy"
creadme "$D" "Strategy" \
"Define the contracts for the strategy lifecycle, including retirement and the capital-eligibility token reference." \
"Carry commands (RegisterStrategy, RetireStrategy), the GetStrategy query, the StrategyApproved event, and strategy DTOs; expose the lifecycle contract." \
"StrategyRepositoryContract, StrategyLifecycleServiceContract; events StrategyRegistered, StrategyApproved, StrategyRetired." \
"n/a" "n/a" \
"MUST NOT mark eligible without a token; MUST NOT promote without replication and the scientific gate." \
"core-domain strategy context; Signal, Validation, Portfolio, and Governance contracts." \
"CLAUDE.md (RL-1/2, FC-1..5, RG-1..3); Architecture V2 §5.5/§5.6; Strategy Registry; P2-08/09."

# ---- portfolio ------------------------------------------------------------
D="$SRC/portfolio"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Portfolio contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class AllocationDto(Dto):
    strategy_id: Id
    weight: float


@dataclass(frozen=True, slots=True)
class PortfolioDto(Dto):
    id: Id
    allocations: tuple[AllocationDto, ...]


@dataclass(frozen=True, slots=True)
class ConstructPortfolio(Command):
    """Construct from capital-eligible alphas only, net-of-cost, within limits (PS-1/2)."""

    eligible_strategy_ids: tuple[Id, ...]
    constraints: str


@dataclass(frozen=True, slots=True)
class GetPortfolio(Query):
    portfolio_id: Id


@dataclass(frozen=True, slots=True)
class ConstructPortfolioResponse(Response):
    portfolio: PortfolioDto
PY
cat > "$D/events.py" <<'PY'
"""Portfolio event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class PortfolioConstructed(Event):
    """Canonical event: an immutable portfolio snapshot was constructed (net-of-cost, PS-4)."""

    portfolio_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Portfolio repository and optimizer contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import ConstructPortfolio, ConstructPortfolioResponse, PortfolioDto


class PortfolioRepositoryContract(Protocol):
    def get(self, id: Id) -> PortfolioDto: ...
    def add(self, portfolio: PortfolioDto) -> None: ...


class PortfolioOptimizerContract(Protocol):
    """Deterministic, net-of-cost optimization; an LLM MUST NOT decide allocation (PS-3, AI-1)."""

    def construct(self, command: ConstructPortfolio) -> ConstructPortfolioResponse: ...
PY
cat > "$D/errors.py" <<'PY'
"""Portfolio error contracts."""
from __future__ import annotations

from enum import Enum


class PortfolioErrorCode(Enum):
    INELIGIBLE_ALPHA = "portfolio.ineligible_alpha"        # PS-1
    GROSS_OPTIMIZATION = "portfolio.gross_optimization"    # PS-2
    CONSTRAINT_VIOLATION = "portfolio.constraint_violation"  # PS-2
PY
mod_init "$D" "Portfolio"
creadme "$D" "Portfolio" \
"Define the contracts for deterministic, net-of-cost portfolio construction from eligible alphas." \
"Carry the ConstructPortfolio command, the GetPortfolio query, the PortfolioConstructed event, and portfolio/allocation DTOs; expose the optimizer contract." \
"PortfolioRepositoryContract, PortfolioOptimizerContract; event PortfolioConstructed." \
"n/a" "n/a" \
"MUST NOT optimize on gross returns; MUST NOT let AI decide allocation/sizing; MUST NOT consume ineligible alphas." \
"core-domain portfolio context; Strategy, Risk, and Execution contracts." \
"CLAUDE.md (PS-1..4, AI-1); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry."

# ---- risk -----------------------------------------------------------------
D="$SRC/risk"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Risk contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import ActorRef, Command, Dto, Id, Query, Response


class RiskVerdict(Enum):
    WITHIN_LIMITS = "within_limits"
    BREACH = "breach"


@dataclass(frozen=True, slots=True)
class RiskLimitDto(Dto):
    name: str
    threshold: float


@dataclass(frozen=True, slots=True)
class RiskAssessmentDto(Dto):
    subject_id: Id
    verdict: RiskVerdict


@dataclass(frozen=True, slots=True)
class EvaluateRisk(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class EngageKillSwitch(Command):
    """Force execution to paper/halt; human-invocable, NEVER AI-gated (RS-3, HO-4)."""

    invoked_by: ActorRef


@dataclass(frozen=True, slots=True)
class GetRiskAssessment(Query):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class RiskVerdictResponse(Response):
    assessment: RiskAssessmentDto
PY
cat > "$D/events.py" <<'PY'
"""Risk event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class RiskValidated(Event):
    """Canonical event: independent risk sign-off was granted at promotion (RS-2)."""

    subject_id: Id


@dataclass(frozen=True, slots=True)
class LimitBreached(Event):
    subject_id: Id
    limit_name: str


@dataclass(frozen=True, slots=True)
class KillSwitchEngaged(Event):
    engaged_by: str
PY
cat > "$D/interfaces.py" <<'PY'
"""Risk repository, limit-engine, and kill-switch contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    EngageKillSwitch,
    EvaluateRisk,
    RiskLimitDto,
    RiskVerdictResponse,
)


class RiskLimitRepositoryContract(Protocol):
    def get(self, id: Id) -> RiskLimitDto: ...
    def add(self, limit: RiskLimitDto) -> None: ...


class RiskLimitEngineContract(Protocol):
    """Deterministic limit evaluation (RS-1)."""

    def evaluate(self, command: EvaluateRisk) -> RiskVerdictResponse: ...


class KillSwitchContract(Protocol):
    """Human-invocable, never AI-gated (RS-3, HO-4)."""

    def engage(self, command: EngageKillSwitch) -> None: ...
PY
cat > "$D/errors.py" <<'PY'
"""Risk error contracts."""
from __future__ import annotations

from enum import Enum


class RiskErrorCode(Enum):
    HARD_LIMIT_BREACH = "risk.hard_limit_breach"          # RS-1
    AI_HALT_ATTEMPT = "risk.ai_halt_attempt"              # AI-1, RS-1
    INDEPENDENCE_VIOLATION = "risk.independence_violation"  # RS-2, CP-5
PY
mod_init "$D" "Risk"
creadme "$D" "Risk" \
"Define the contracts for independent, deterministic risk limits and the human-invocable kill-switch." \
"Carry commands (EvaluateRisk, EngageKillSwitch), the GetRiskAssessment query, the RiskValidated event, and risk DTOs; expose the limit-engine and kill-switch contracts." \
"RiskLimitRepositoryContract, RiskLimitEngineContract, KillSwitchContract; events RiskValidated, LimitBreached, KillSwitchEngaged." \
"n/a" "n/a" \
"MUST NOT let AI decide a halt/kill-switch; MUST NOT be overridden by the first line; MUST NOT report to research." \
"core-domain risk context; Portfolio and Execution contracts." \
"CLAUDE.md (RS-1..4, CP-5, HO-4); Architecture V2 §5.7; RB-13 · RISK; P1-03."

# ---- validation -----------------------------------------------------------
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Validation contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class Verdict(Enum):
    PASS = "pass"
    FAIL = "fail"


@dataclass(frozen=True, slots=True)
class DeflatedMetricDto(Dto):
    name: str
    value: float


@dataclass(frozen=True, slots=True)
class VerdictDto(Dto):
    subject_id: Id
    verdict: Verdict


@dataclass(frozen=True, slots=True)
class RunValidation(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class AllocateHoldout(Command):
    """One-shot, rotating holdout; iterative reuse is PROHIBITED (SI-4, P2-05)."""

    subject_id: Id


@dataclass(frozen=True, slots=True)
class RequestReplication(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class GetVerdict(Query):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class ValidationVerdictResponse(Response):
    verdict: VerdictDto
PY
cat > "$D/events.py" <<'PY'
"""Validation event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ValidationCompleted(Event):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class HoldoutConsumed(Event):
    subject_id: Id
    budget_id: str


@dataclass(frozen=True, slots=True)
class CapitalEligibilityIssued(Event):
    """The scientific gate issued a capital-eligibility token (P2-09)."""

    subject_id: Id
    eligibility_token: str
PY
cat > "$D/interfaces.py" <<'PY'
"""Validation engine contracts — the deterministic adjudication ports (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    AllocateHoldout,
    RequestReplication,
    RunValidation,
    ValidationVerdictResponse,
)


class ValidationRepositoryContract(Protocol):
    def get(self, id: Id) -> ValidationVerdictResponse: ...


class MultipleTestingEnforcerContract(Protocol):
    """Deterministic multiple-testing budget gate over the Trial Ledger (P2-02)."""

    def check_budget(self, subject_id: Id) -> ValidationVerdictResponse: ...


class ValidationGauntletContract(Protocol):
    """Leakage harness + purged/embargoed CPCV + PBO (deterministic)."""

    def run(self, command: RunValidation) -> ValidationVerdictResponse: ...


class HoldoutEmbargoManagerContract(Protocol):
    """One-shot, rotating holdout allocation (SI-4)."""

    def allocate(self, command: AllocateHoldout) -> None: ...


class ReplicationEngineContract(Protocol):
    """Independent replication by a separate code path (VS-4, P2-08)."""

    def replicate(self, command: RequestReplication) -> ValidationVerdictResponse: ...


class ScientificGateContract(Protocol):
    """Issues capital-eligibility tokens; an LLM MUST NEVER assert significance (AI-2/3, P2-09)."""

    def adjudicate(self, subject_id: Id) -> ValidationVerdictResponse: ...
PY
cat > "$D/errors.py" <<'PY'
"""Validation error contracts."""
from __future__ import annotations

from enum import Enum


class ValidationErrorCode(Enum):
    OOS_REUSE = "validation.oos_reuse"                        # SI-4, P2-05
    UNDEFLATED_SIGNIFICANCE = "validation.undeflated"         # SI-3
    LLM_VALIDATION_ATTEMPT = "validation.llm_attempt"         # AI-2, FB-2
    REPLICATION_FAILED = "validation.replication_failed"      # VS-4, P2-08
PY
mod_init "$D" "Validation"
creadme "$D" "Validation" \
"Define the contracts for the deterministic validation gauntlet, one-shot holdout, replication, and the scientific gate." \
"Carry commands (RunValidation, AllocateHoldout, RequestReplication), the GetVerdict query, the ValidationCompleted/CapitalEligibilityIssued events, and verdict DTOs; expose the engine contracts." \
"ValidationRepositoryContract, MultipleTestingEnforcerContract, ValidationGauntletContract, HoldoutEmbargoManagerContract, ReplicationEngineContract, ScientificGateContract; events ValidationCompleted, HoldoutConsumed, CapitalEligibilityIssued." \
"n/a" "n/a" \
"MUST NOT let an LLM assert significance/verdict; MUST NOT reuse OOS iteratively; MUST NOT present undeflated significance." \
"core-domain validation context; Experiment, Strategy, and Governance contracts." \
"CLAUDE.md (SI-1..5, VS-1..4, AI-2/3); Architecture V2 §5.6, §6.3; RB-01 · STAT; RB-04 · VAL; P2-01..09."

# ---- execution ------------------------------------------------------------
D="$SRC/execution"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Execution contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class ExecutionMode(Enum):
    PAPER = "paper"  # default (DEP-1)
    LIVE = "live"
    HALT = "halt"


@dataclass(frozen=True, slots=True)
class AuthorizationTokenDto(Dto):
    id: str
    expires_at: str  # ISO-8601; time-boxed (RS-4)


@dataclass(frozen=True, slots=True)
class OrderDto(Dto):
    id: Id
    mode: ExecutionMode


@dataclass(frozen=True, slots=True)
class ParityReportDto(Dto):
    within_tolerance: bool


@dataclass(frozen=True, slots=True)
class AuthorizeExecution(Command):
    """Live execution requires a valid, time-boxed governance token; AI never authorizes (AI-1)."""

    order_id: Id
    token: AuthorizationTokenDto


@dataclass(frozen=True, slots=True)
class GetOrder(Query):
    order_id: Id


@dataclass(frozen=True, slots=True)
class AuthorizeExecutionResponse(Response):
    order: OrderDto
PY
cat > "$D/events.py" <<'PY'
"""Execution event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ExecutionAuthorized(Event):
    """Canonical event: live execution was authorized by a valid governance token (RS-4)."""

    order_id: Id
    authorization_token: str


@dataclass(frozen=True, slots=True)
class FillRecorded(Event):
    order_id: Id


@dataclass(frozen=True, slots=True)
class ParityBreachDetected(Event):
    order_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Execution authority, parity, and reconciliation contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import AuthorizeExecution, AuthorizeExecutionResponse, OrderDto, ParityReportDto


class OrderRepositoryContract(Protocol):
    def get(self, id: Id) -> OrderDto: ...
    def add(self, order: OrderDto) -> None: ...


class ExecutionAuthorityContract(Protocol):
    """Deterministic execution; live impossible without a token; AI never executes (RS-4, AI-1)."""

    def authorize(self, command: AuthorizeExecution) -> AuthorizeExecutionResponse: ...


class ParityHarnessContract(Protocol):
    def check(self, order_id: Id) -> ParityReportDto: ...


class ReconciliationServiceContract(Protocol):
    def reconcile(self) -> bool: ...
PY
cat > "$D/errors.py" <<'PY'
"""Execution error contracts."""
from __future__ import annotations

from enum import Enum


class ExecutionErrorCode(Enum):
    UNAUTHORIZED_EXECUTION = "execution.unauthorized"          # RS-4, FB-12
    AI_EXECUTION_ATTEMPT = "execution.ai_attempt"              # AI-1, FB-1
    PARITY_BREACH = "execution.parity_breach"                  # P3-15
    IRREVERSIBLE_DEPLOYMENT = "execution.irreversible"         # DEP-3
PY
mod_init "$D" "Execution"
creadme "$D" "Execution" \
"Define the contracts for paper-first, token-gated, deterministic execution and reconciliation." \
"Carry the AuthorizeExecution command, the GetOrder query, the ExecutionAuthorized event, and order/token/parity DTOs; expose the execution-authority contract." \
"OrderRepositoryContract, ExecutionAuthorityContract, ParityHarnessContract, ReconciliationServiceContract; events ExecutionAuthorized, FillRecorded, ParityBreachDetected." \
"n/a" "n/a" \
"MUST NOT execute without authorization; MUST NOT let AI decide/authorize execution; MUST NOT deploy irreversibly." \
"core-domain execution context; Portfolio, Risk, and Governance contracts." \
"CLAUDE.md (RS-4, DEP-1..4, AI-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; Execution Governance; P3-15."

# ---- workflow -------------------------------------------------------------
D="$SRC/workflow"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Workflow contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class WorkflowState(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    ESCALATED = "escalated"


@dataclass(frozen=True, slots=True)
class GateResultDto(Dto):
    gate: str
    passed: bool


@dataclass(frozen=True, slots=True)
class WorkflowInstanceDto(Dto):
    id: Id
    state: WorkflowState


@dataclass(frozen=True, slots=True)
class StartWorkflow(Command):
    definition_id: Id


@dataclass(frozen=True, slots=True)
class AdvanceWorkflow(Command):
    """Advance only via a declared transition whose gate passed (WFC-16, AV2-18)."""

    instance_id: Id
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class GetWorkflowInstance(Query):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class StartWorkflowResponse(Response):
    instance_id: Id
PY
cat > "$D/events.py" <<'PY'
"""Workflow event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id

from .messages import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowStarted(Event):
    instance_id: Id


@dataclass(frozen=True, slots=True)
class StageTransitioned(Event):
    instance_id: Id
    to_state: WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowCompleted(Event):
    """Canonical event: a workflow reached COMPLETED with all gates and approvals (AV2-18)."""

    instance_id: Id


@dataclass(frozen=True, slots=True)
class WorkflowEscalated(Event):
    instance_id: Id
PY
cat > "$D/interfaces.py" <<'PY'
"""Workflow engine, gate-evaluator, and compensator contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    AdvanceWorkflow,
    GateResultDto,
    StartWorkflow,
    StartWorkflowResponse,
    WorkflowInstanceDto,
)


class WorkflowRepositoryContract(Protocol):
    def get(self, id: Id) -> WorkflowInstanceDto: ...
    def add(self, instance: WorkflowInstanceDto) -> None: ...


class RunLedgerContract(Protocol):
    """Append-only run ledger recording every workflow run (WCON-3, OB-1)."""

    def record(self, instance_id: Id) -> None: ...


class WorkflowEngineContract(Protocol):
    """Orchestrates transitions; it NEVER adjudicates (WCON-2, AV2-18)."""

    def start(self, command: StartWorkflow) -> StartWorkflowResponse: ...
    def advance(self, command: AdvanceWorkflow) -> None: ...


class GateEvaluatorContract(Protocol):
    """Delegates a gate to its owning deterministic engine or human approver."""

    def evaluate(self, instance_id: Id, gate: str) -> GateResultDto: ...


class CompensatorContract(Protocol):
    """Saga compensation so partial failures leave consistent state (WFC-19, RE-1)."""

    def compensate(self, instance_id: Id) -> None: ...
PY
cat > "$D/errors.py" <<'PY'
"""Workflow error contracts."""
from __future__ import annotations

from enum import Enum


class WorkflowErrorCode(Enum):
    UNDECLARED_TRANSITION = "workflow.undeclared_transition"  # WFC-16
    STAGE_SKIPPED = "workflow.stage_skipped"                  # WFC-3
    GATE_BYPASSED = "workflow.gate_bypassed"                  # AV2-18
    INCONSISTENT_STATE = "workflow.inconsistent_state"        # WFC-19, RE-1
PY
mod_init "$D" "Workflow"
creadme "$D" "Workflow" \
"Define the contracts for the workflow state machine, transitions, and gates (orchestrate, never adjudicate)." \
"Carry commands (StartWorkflow, AdvanceWorkflow), the GetWorkflowInstance query, the WorkflowCompleted event, and instance/gate DTOs; expose the engine/gate/compensator contracts." \
"WorkflowRepositoryContract, RunLedgerContract, WorkflowEngineContract, GateEvaluatorContract, CompensatorContract; events WorkflowStarted, StageTransitioned, WorkflowCompleted, WorkflowEscalated." \
"n/a" "n/a" \
"MUST NOT carry decision logic; MUST NOT permit undeclared transitions or stage-skipping; MUST NOT bypass a gate." \
"core-domain workflow context; all contexts it orchestrates." \
"CLAUDE.md (WCON-1..3, RE-1); Architecture V2 §5.4; Workflow Contracts (Tier-5)."

# ---- agent ----------------------------------------------------------------
D="$SRC/agent"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Agent contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import AuthorityLevel, Command, Dto, Id, Query, Response


class TrustLevel(Enum):
    U = "U"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"


@dataclass(frozen=True, slots=True)
class ModelPinDto(Dto):
    model_id: str
    version: str  # unpinned/'latest' is PROHIBITED (AI-6)


@dataclass(frozen=True, slots=True)
class AgentRegistrationDto(Dto):
    id: Id
    authority: AuthorityLevel  # MUST be PROPOSE or NARRATE (REG-9)
    trust: TrustLevel
    model: ModelPinDto


@dataclass(frozen=True, slots=True)
class RegisterAgent(Command):
    registration: AgentRegistrationDto


@dataclass(frozen=True, slots=True)
class CertifyAgent(Command):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class SuspendAgent(Command):
    agent_id: Id
    reason: str


@dataclass(frozen=True, slots=True)
class RecordAgentOutput(Command):
    """Advisory output recorded with provenance; never a decision (AI-8, APR-2)."""

    agent_id: Id
    output_hash: str


@dataclass(frozen=True, slots=True)
class GetAgentRegistration(Query):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class RegisterAgentResponse(Response):
    agent_id: Id
PY
cat > "$D/events.py" <<'PY'
"""Agent event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class AgentCertified(Event):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class AgentSuspended(Event):
    agent_id: Id


@dataclass(frozen=True, slots=True)
class AgentOutputRecorded(Event):
    agent_id: Id
    output_hash: str
PY
cat > "$D/interfaces.py" <<'PY'
"""Agent registry, model-registry, and policy contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import AgentRegistrationDto, ModelPinDto, RegisterAgent, RegisterAgentResponse


class AgentRegistryPortContract(Protocol):
    """Deterministic registry; agents cannot edit their own entry (REG-22)."""

    def get(self, id: Id) -> AgentRegistrationDto: ...
    def register(self, command: RegisterAgent) -> RegisterAgentResponse: ...


class ModelRegistryPortContract(Protocol):
    """Only pinned models may run (AI-6, P4-01)."""

    def is_pinned(self, model: ModelPinDto) -> bool: ...


class AgentAuthorityPolicyContract(Protocol):
    """Enforces propose/narrate ceilings; never decide (AI-1..4, REG-9)."""

    def is_permitted(self, agent_id: Id, action: str) -> bool: ...


class IsolationPolicyContract(Protocol):
    """Enforces the generator-vs-validator air-gap (P2-07)."""

    def may_access(self, agent_id: Id, resource: str) -> bool: ...
PY
cat > "$D/errors.py" <<'PY'
"""Agent error contracts."""
from __future__ import annotations

from enum import Enum


class AgentErrorCode(Enum):
    DECIDE_AUTHORITY_FORBIDDEN = "agent.decide_forbidden"  # REG-9, AI-1..4
    SELF_ESCALATION = "agent.self_escalation"              # REG-22/23
    UNPINNED_MODEL = "agent.unpinned_model"                # AI-6
    UNREGISTERED_AGENT = "agent.unregistered"              # REG-1
PY
mod_init "$D" "Agent"
creadme "$D" "Agent" \
"Define the contracts for registered, contract-bound, advisory-only AI agents (propose/narrate, model-pinned)." \
"Carry commands (RegisterAgent, CertifyAgent, SuspendAgent, RecordAgentOutput), the GetAgentRegistration query, agent events, and registration/model-pin DTOs; expose the registry and policy contracts." \
"AgentRegistryPortContract, ModelRegistryPortContract, AgentAuthorityPolicyContract, IsolationPolicyContract; events AgentCertified, AgentSuspended, AgentOutputRecorded." \
"n/a" "n/a" \
"MUST NOT carry or grant decide authority; MUST NOT permit self-edit/self-escalation; MUST NOT allow an unpinned model or an isolation breach." \
"core-domain agent context; Workflow and all narrated engines." \
"CLAUDE.md (AI-1..8, AG-1..4); Architecture V2 §5.3; RB-15 · AIGOV; Agent Registry; Agent Contracts; P4-01/02, P2-07."

# ---- governance -----------------------------------------------------------
D="$SRC/governance"; mkdir -p "$D"
cat > "$D/messages.py" <<'PY'
"""Governance contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import ActorRef, Command, Dto, Id, Query, Response


class ApprovalDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class CapitalEligibilityTokenDto(Dto):
    id: str
    subject_id: Id


@dataclass(frozen=True, slots=True)
class ApprovalDto(Dto):
    subject_id: Id
    decision: ApprovalDecision
    counter_signed: bool  # required for capital-affecting approvals (HO-2)


@dataclass(frozen=True, slots=True)
class RequestApproval(Command):
    subject_id: Id
    approver: ActorRef


@dataclass(frozen=True, slots=True)
class RecordOverride(Command):
    """A human override; MUST NOT bypass statistical/risk controls (HO-3); rationale required (HO-2)."""

    subject_id: Id
    approver: ActorRef
    rationale: str


@dataclass(frozen=True, slots=True)
class IssueCapitalEligibility(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class GetApproval(Query):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class ApprovalResponse(Response):
    approval: ApprovalDto
PY
cat > "$D/events.py" <<'PY'
"""Governance event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ProductionDeploymentApproved(Event):
    """A production deployment was approved (counter-signed for capital) (HO-2, AV2-15)."""

    subject_id: Id


@dataclass(frozen=True, slots=True)
class OverrideRecorded(Event):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class GovernanceHalt(Event):
    reason: str
PY
cat > "$D/interfaces.py" <<'PY'
"""Governance approval-engine, audit-trail, and tiered-autonomy contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import ApprovalDto, ApprovalResponse, RequestApproval


class ApprovalRepositoryContract(Protocol):
    def get(self, id: Id) -> ApprovalDto: ...
    def add(self, approval: ApprovalDto) -> None: ...


class AuditTrailContract(Protocol):
    """Append-only, tamper-evident (hash-chained) audit trail (SEC-4, CP-7)."""

    def append(self, entry_hash: str, prev_hash: str) -> None: ...


class ApprovalEngineContract(Protocol):
    """Routes critical transitions to human approvers; a control-defeating override is void (HO-3)."""

    def request_approval(self, command: RequestApproval) -> ApprovalResponse: ...


class TieredAutonomyPolicyContract(Protocol):
    """Scales human oversight without rubber-stamping (P5-05, SC-4)."""

    def required_tier(self, subject_id: Id) -> str: ...
PY
cat > "$D/errors.py" <<'PY'
"""Governance error contracts."""
from __future__ import annotations

from enum import Enum


class GovernanceErrorCode(Enum):
    MISSING_COUNTER_SIGNATURE = "governance.missing_counter_signature"  # HO-2
    AI_OVERRIDE_ATTEMPT = "governance.ai_override_attempt"              # HO-1, AI-4
    CONTROL_BYPASS_OVERRIDE = "governance.control_bypass_override"      # HO-3 (void)
    UNAUTHORIZED_APPROVAL = "governance.unauthorized_approval"          # CP-5, HO-1
PY
mod_init "$D" "Governance"
creadme "$D" "Governance" \
"Define the contracts for human approvals, capital-eligibility tokens, overrides, and the tamper-evident audit trail." \
"Carry commands (RequestApproval, RecordOverride, IssueCapitalEligibility), the GetApproval query, governance events, and approval/token DTOs; expose the approval-engine and audit-trail contracts." \
"ApprovalRepositoryContract, AuditTrailContract, ApprovalEngineContract, TieredAutonomyPolicyContract; events ProductionDeploymentApproved, OverrideRecorded, GovernanceHalt." \
"n/a" "n/a" \
"MUST NOT let AI override a human decision; MUST NOT approve capital without counter-sign; MUST NOT use an override to bypass statistical/risk controls." \
"core-domain governance context; Strategy, Validation, and Execution contracts." \
"CLAUDE.md (HO-1..4, CP-5/7, SEC-4); Architecture V2 §5.1, §6.2; ADR Governance; P2-09, P5-05."

echo "Shared Contracts Foundation generated."
