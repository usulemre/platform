#!/usr/bin/env bash
#
# generate_feature_service.sh — Phase 2.4 Feature Service generator.
#
# Governed by: CLAUDE.md (FA-1..4, PIT-1/3, DP-1/3, CP-2/6/7, AD-1/3, AI-2, DE-1, RL-1/2); Architecture
#              V2 §5.5 (Research Intelligence) & §5.8 (Data Platform), §6.1/§6.4; Implementation Roadmap
#              Phase 3; RB-09/10 · FAR, RB-08 · PIT; Feature Registry; P1-06, P2-03, P2-07.
#
# Emits the Feature Service under services/feature-service as `feature_service`: the feature aggregate
# + lifecycle, registration, discovery, metadata, ownership, classification, lineage, dependency
# management, versioning, validation coordination, Feature Registry integration, approval, service/
# repository interfaces, policies, specifications, domain events, and errors. It reuses core_domain
# (feature context + shared kernel) and the Validation Foundation (platform_validation); it references
# Data Platform / Research / Experiment by identity (SE-2).
#
# A feature is a DECLARATIVE, PIT-bound, leakage-clean, provenance-bearing, VERSIONED artifact. The
# Feature Service ORCHESTRATES and RECORDS; it NEVER computes features/factors, NEVER runs ML or
# statistics, NEVER adjudicates significance (CP-5, AI-2), and NEVER exposes look-ahead/OOS (PIT-3,
# AD-3, P2-07). Acceptance requires the deterministic Leakage Harness to pass (FA-2, P2-03). It
# contains NO factor calculations, NO statistical algorithms, NO persistence, NO infrastructure, NO
# API. Deterministic, technology-independent, immutable, auditable, traceable, versioned, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/feature-service"
SRC="$SVC/src/feature_service"
cd "$ROOT"

freadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# feature-service · $2

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

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
# feature-service — the Feature lifecycle & orchestration service (Phase 2.4).
# Standard library + Phase-1/2 foundations only. No factor-calc/statistics/persistence/API deps.
[project]
name = "feature-service"
version = "0.1.0"
description = "Feature Service: feature aggregate, lifecycle, lineage, versioning, validation coordination."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/feature_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# feature-service — Feature Service implemented in Phase 2.4

This service contains the Feature Service (the `feature_service` package): the feature aggregate,
lifecycle, registration, discovery, metadata, ownership, classification, lineage, dependency
management, versioning, validation coordination, Feature Registry integration, approval, service/
repository interfaces, policies, specifications, domain events, and errors. Factor calculations,
feature-engineering implementation, ML, statistical algorithms, persistence, infrastructure, and APIs
remain forbidden here. The Leakage Harness and significance decisions belong to the deterministic engines.
MD

cat > "$SRC/__init__.py" <<'PY'
"""feature_service — the Feature Service: governs the lifecycle of research features.

A feature is a DECLARATIVE, point-in-time-bound, leakage-clean, provenance-bearing, VERSIONED
artifact derived from one or more datasets. This service is the institutional source of truth for
feature creation, lineage, validation coordination, and lifecycle management, connecting the Data
Platform, Research, Dataset, and Experiment services with downstream Backtesting/Signal/Portfolio
components (by identity). It reuses the Phase-1/2 foundations (core_domain feature context + shared
kernel, platform_validation) and integrates with the Feature Registry.

Authority & boundaries (FA-1..4, PIT-3, CP-5, AI-2, AD-3): the Feature Service ORCHESTRATES and
RECORDS; it NEVER computes features/factors, NEVER runs ML or statistics, NEVER adjudicates
significance, and NEVER exposes look-ahead/OOS. Acceptance requires the deterministic Leakage Harness
to pass (FA-2, P2-03); every feature carries provenance (FA-3) and is versioned/immutable (FA-4).

Boundaries: no factor calculation, no feature-engineering implementation, no ML, no statistics, no
persistence, no infrastructure, no API.

Modules: model, status, lifecycle, versioning, classification, ownership, metadata, dependencies,
lineage, registration, discovery, validation_coordination, registry_integration, approval,
management, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    approval,
    classification,
    dependencies,
    discovery,
    errors,
    events,
    lifecycle,
    lineage,
    management,
    metadata,
    model,
    ownership,
    policies,
    registration,
    registry_integration,
    repositories,
    specifications,
    status,
    validation_coordination,
    versioning,
)

__all__ = [
    "model", "status", "lifecycle", "versioning", "classification", "ownership", "metadata",
    "dependencies", "lineage", "registration", "discovery", "validation_coordination",
    "registry_integration", "approval", "management", "policies", "specifications", "events",
    "errors", "repositories",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class FeatureLifecycle(Enum):
    """The canonical feature lifecycle."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    IMPLEMENTED = "implemented"
    VALIDATING = "validating"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


L = FeatureLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[FeatureLifecycle, FeatureLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.IMPLEMENTED),
    (L.IMPLEMENTED, L.VALIDATING),
    (L.VALIDATING, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.DEPRECATED),
    (L.DEPRECATED, L.ARCHIVED),
    # revision (fix and re-validate)
    (L.IMPLEMENTED, L.REGISTERED),
    (L.VALIDATING, L.IMPLEMENTED),
    # superseding / rollback (governed reactivation of a rolled-back-to version)
    (L.DEPRECATED, L.ACTIVE),
)

#: Terminal state. Branching a feature creates a NEW versioned feature (with lineage), never a
#: mutation of history (RL-1) — ARCHIVED has no outbound transition here.
TERMINAL_STATES: frozenset[FeatureLifecycle] = frozenset({L.ARCHIVED})


class FeatureLifecycleService(Protocol):
    """Governs lifecycle transitions. APPROVED/ACTIVE require the deterministic Leakage Harness and
    validation gate to have passed (FA-2); the service performs NO adjudication. Interface only."""

    def transition(self, feature: EntityId, to: FeatureLifecycle) -> None: ...
PY
freadme "$D" "lifecycle" \
"Define FeatureLifecycle (PROPOSED/REGISTERED/IMPLEMENTED/VALIDATING/APPROVED/ACTIVE/DEPRECATED/ARCHIVED), the canonical transitions (revision/superseding/rollback/retirement), and the lifecycle-service interface." \
"Enumerate the lifecycle and its legal transitions as data; approval/activation require the passed Leakage Harness + validation gate; branching creates new lineage (RL-1); hold no logic." \
"Consumed by model, status, approval, management, policies." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (FA-2/4, RL-1/2, CP-5); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry; P2-03."

# ===========================================================================
# status
# ===========================================================================
D="$SRC/status"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from feature_service.lifecycle import FeatureLifecycle


@dataclass(frozen=True, slots=True)
class FeatureStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: FeatureLifecycle
    since: str
PY
freadme "$D" "status" \
"Define FeatureStatus: the current lifecycle state plus the supplied time it was entered." \
"Represent feature status as an immutable value object; hold no logic." \
"Consumed by model and metadata." \
"lifecycle (FeatureLifecycle); standard library." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-09/10 · FAR."

# ===========================================================================
# classification
# ===========================================================================
D="$SRC/classification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Classification — the kind/domain classification of a feature (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class FeatureKind(Enum):
    PRICE = "price"
    VOLUME = "volume"
    FUNDAMENTAL = "fundamental"
    SENTIMENT = "sentiment"
    MICROSTRUCTURE = "microstructure"
    CROSS_SECTIONAL = "cross_sectional"
    TIME_SERIES = "time_series"
    DERIVED = "derived"


class FeatureDomain(Enum):
    EQUITIES = "equities"
    RATES = "rates"
    CREDIT = "credit"
    FX = "fx"
    COMMODITIES = "commodities"
    CROSS_ASSET = "cross_asset"
    ASSET_AGNOSTIC = "asset_agnostic"  # the core never branches on asset class (CP-8)


@dataclass(frozen=True, slots=True)
class FeatureClassification:
    """The classification of a feature (drives ontology placement, KM-3)."""

    kind: FeatureKind
    domain: FeatureDomain
PY
freadme "$D" "classification" \
"Define FeatureClassification with FeatureKind and FeatureDomain enums (asset-agnostic option preserved)." \
"Classify features within the shared feature/factor ontology; the core never branches on asset class; data only." \
"Consumed by model, metadata, discovery, specifications." \
"Standard library only." \
"CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# ownership
# ===========================================================================
D="$SRC/ownership"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Ownership — the accountable owner value object and ownership-transfer interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class FeatureOwner:
    """The accountable owner and steward roles for a feature (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


class FeatureOwnershipService(Protocol):
    """Transfers feature ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, feature: EntityId, to_role: str) -> None: ...
PY
freadme "$D" "ownership" \
"Define FeatureOwner and the FeatureOwnershipService interface: accountable ownership and its transfer." \
"Represent accountable ownership as data and its transfer as a recorded, interface-only operation; hold no logic." \
"Consumed by model, metadata, management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (CP-7, HO-1); Architecture V2 §5.5; RB-09/10 · FAR."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Model — the canonical feature aggregate and value objects (data only).

Reuses the core feature domain (core_domain.feature.FeatureSpec / AcceptanceStatus). A feature is
DECLARATIVE and PIT-bound; this model carries the declaration and references, never the computation.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.feature import AcceptanceStatus, FeatureSpec
from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Ref, Version

from feature_service.classification import FeatureClassification
from feature_service.ownership import FeatureOwner
from feature_service.status import FeatureStatus


@dataclass(frozen=True, slots=True)
class FeatureIdentifier:
    """A stable, versioned identity for a feature (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class FeatureFormulaReference:
    """A reference to the DECLARATIVE feature formula/spec artifact (by content address).

    It references the declarative definition; it is NOT the calculation and holds no logic (FA-1).
    """

    formula: ContentAddress


@dataclass(frozen=True, slots=True)
class FeatureDefinition:
    """The declarative definition of a feature: its spec, formula reference, and dataset inputs.

    Computed only through the as-of path (FA-1, PIT-3); dataset inputs are referenced by identity (SE-2).
    """

    spec: FeatureSpec
    formula: FeatureFormulaReference
    dataset_inputs: tuple[Ref, ...]  # -> dataset_service datasets (by identity)


@dataclass(frozen=True, slots=True)
class FeatureEvidence:
    """Descriptive evidence / economic rationale supporting a feature (not an adjudication)."""

    summary: str
    supports: bool


@dataclass(frozen=True, slots=True)
class FeatureValidationReference:
    """A reference to the feature's leakage/validation report artifact (never the report content).

    Points to the deterministic Leakage Harness / validation result by identity (FA-2, P2-03).
    """

    report: Ref


@dataclass(eq=False)
class Feature(AggregateRoot):
    """A feature (aggregate root): a declarative, PIT-bound, leakage-clean, provenance-bearing,
    versioned artifact.

    It orchestrates and records; it does NOT compute the feature, does NOT run statistics/ML, and does
    NOT adjudicate significance (CP-5, AI-2). Acceptance requires the deterministic Leakage Harness (FA-2).
    """

    identifier: FeatureIdentifier
    definition: FeatureDefinition
    classification: FeatureClassification
    owner: FeatureOwner
    status: FeatureStatus
    acceptance: AcceptanceStatus
    provenance: Provenance
PY
freadme "$D" "model" \
"Define the canonical feature models: Feature (aggregate), FeatureIdentifier, FeatureDefinition, FeatureFormulaReference, FeatureEvidence, FeatureValidationReference (reusing core FeatureSpec/AcceptanceStatus)." \
"Represent a feature as an immutable, declarative, PIT-bound, provenance-bearing, versioned aggregate that references (never computes) its formula/inputs; hold no logic, no calculation, no adjudication." \
"Consumed by every Feature Service module; references datasets/validation-reports by identity; reuses core_domain.feature." \
"core_domain.feature (FeatureSpec, AcceptanceStatus); core_domain.shared (AggregateRoot, ContentAddress, Provenance, Ref, Version); classification; ownership; status." \
"CLAUDE.md (FA-1..4, PIT-3, DP-3, CP-2/5/7, AD-1, NM-2); Architecture V2 §5.5, §5.8, §6.1; RB-09/10 · FAR; P1-06, P2-03."

# ===========================================================================
# versioning
# ===========================================================================
D="$SRC/versioning"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Versioning — the immutable feature version and versioning INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import ContentAddress, EntityId

from feature_service.model import FeatureIdentifier


@dataclass(frozen=True, slots=True)
class FeatureVersion:
    """An immutable, content-addressed feature version (CP-2; changes create a new version, FA-4)."""

    feature_id: FeatureIdentifier
    content: ContentAddress
    supersedes: str | None


class FeatureVersioningService(Protocol):
    """Creates new immutable versions and coordinates superseding/rollback. Interface only.

    A new version re-enters validation; historical versions are preserved (VER-2, RP-4).
    """

    def create_version(self, feature: EntityId) -> FeatureVersion: ...
    def supersede(self, old: EntityId, new: EntityId) -> None: ...
    def rollback(self, feature: EntityId, to_version: str) -> None: ...
PY
freadme "$D" "versioning" \
"Define FeatureVersion and FeatureVersioningService: immutable feature versioning with superseding and rollback." \
"Express immutable versioning, superseding, and rollback as data + interfaces; a new version revalidates; history is preserved; hold no logic." \
"Consumed by management and lifecycle." \
"core_domain.shared (ContentAddress, EntityId); model." \
"CLAUDE.md (CP-2, FA-4, VER-1/2, RP-4, DEPR-1..3); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# dependencies
# ===========================================================================
D="$SRC/dependencies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Dependency Management — links from a feature to datasets/features/research/experiments (by id).

All links are by identity/reference (SE-2); no feature module reaches into another context's
internals, and none creates a channel that would let generation observe validation/OOS (AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class DependencyKind(Enum):
    DATASET = "dataset"              # Data Platform / Dataset Service references
    UPSTREAM_FEATURE = "upstream_feature"
    RESEARCH = "research"            # Research Service context
    EXPERIMENT = "experiment"        # Experiment Service references
    VALIDATION = "validation"        # a reference only; outcomes are not observable by generation


@dataclass(frozen=True, slots=True)
class FeatureDependency:
    """A declared dependency of a feature on another artifact, by identity."""

    kind: DependencyKind
    target: Ref


class FeatureDependencyService(Protocol):
    """Declares and lists feature dependencies. Interface only — hidden dependencies are PROHIBITED."""

    def declare(self, feature: EntityId, dependency: FeatureDependency) -> None: ...
PY
freadme "$D" "dependencies" \
"Define FeatureDependency, DependencyKind, and FeatureDependencyService: declared links from a feature to datasets, upstream features, research, experiments, and validation." \
"Represent cross-context dependencies by identity only; declare all dependencies explicitly; never create an isolation-barrier-breaching channel; hold no logic." \
"Consumed by management, lineage, repositories; connects to Data Platform/Research/Experiment/Validation by reference." \
"core_domain.shared (EntityId, Ref); standard library." \
"CLAUDE.md (SE-2, AC-1/3, AD-3, DP-2); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; P2-07."

# ===========================================================================
# lineage
# ===========================================================================
D="$SRC/lineage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Lineage — the feature lineage model and graph INTERFACE (traceability; defect propagation)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, LineageRef, Ref

from feature_service.model import FeatureIdentifier


@dataclass(frozen=True, slots=True)
class FeatureLineageEdge:
    """A directed lineage edge from an upstream artifact to this feature."""

    upstream: Ref  # dataset or upstream feature, by identity
    downstream: FeatureIdentifier
    transform: str  # a label describing the (declarative) transform; not the computation


@dataclass(frozen=True, slots=True)
class FeatureLineage:
    """Complete lineage of a feature back to its raw dataset sources (DP-1, traceability)."""

    feature: FeatureIdentifier
    lineage_ref: LineageRef
    upstream: tuple[FeatureLineageEdge, ...]


class FeatureLineageGraph(Protocol):
    """The feature lineage graph. Interface only — no storage.

    A defect discovered in any source MUST be able to invalidate this feature and everything
    downstream (CP-6, DP-2).
    """

    def upstream_of(self, feature: EntityId) -> tuple[FeatureLineageEdge, ...]: ...
    def invalidate_downstream(self, feature: EntityId) -> None: ...
PY
freadme "$D" "lineage" \
"Define FeatureLineage, FeatureLineageEdge, and the FeatureLineageGraph interface (with downstream invalidation)." \
"Model complete lineage to raw dataset sources for traceability and enable defect propagation (a source defect invalidates the feature and downstream); hold no persistence or computation." \
"Consumed by repositories and management; connects to datasets/upstream features by identity." \
"core_domain.shared (EntityId, LineageRef, Ref); model." \
"CLAUDE.md (CP-6, DP-1/2, DEPR-2); Architecture V2 §5.5, §5.8; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Metadata — the immutable, auditable metadata of a feature (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from feature_service.classification import FeatureClassification
from feature_service.model import FeatureIdentifier
from feature_service.ownership import FeatureOwner
from feature_service.status import FeatureStatus


@dataclass(frozen=True, slots=True)
class FeatureMetadata:
    """Immutable metadata for a feature (auditable, provenance-bearing)."""

    identifier: FeatureIdentifier
    description: str
    classification: FeatureClassification
    owner: FeatureOwner
    status: FeatureStatus
    provenance: Provenance
    tags: tuple[str, ...]
PY
freadme "$D" "metadata" \
"Define FeatureMetadata: the immutable, auditable, provenance-bearing metadata of a feature." \
"Carry feature metadata (identity, description, classification, owner, status, provenance, tags) as data; hold no logic." \
"Consumed by discovery, management, repositories." \
"core_domain.shared (Provenance); model; classification; ownership; status." \
"CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# registration
# ===========================================================================
D="$SRC/registration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Registration — register-before-use registration into the Feature Registry/Marketplace."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.model import Feature


class FeatureRegistrationService(Protocol):
    """Registers a feature (register-before-use) with a declarative definition and provenance (FA-1/3).

    A feature is accepted into the Marketplace only after the deterministic Leakage Harness passes
    (FA-2, P2-03); the service performs no computation and no adjudication. Interface only.
    """

    def register(self, feature: Feature) -> EntityId: ...
PY
freadme "$D" "registration" \
"Define FeatureRegistrationService: register-before-use registration with a declarative definition and provenance." \
"Orchestrate feature registration; require the declarative definition and provenance; acceptance is gated by the deterministic Leakage Harness; hold no computation." \
"Consumed by management; precedes validation_coordination and approval." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (FA-1..4, DP-1); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry; P2-03."

# ===========================================================================
# discovery
# ===========================================================================
D="$SRC/discovery"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Discovery — the Feature Marketplace discovery INTERFACE (over accepted features)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from feature_service.classification import FeatureClassification
from feature_service.metadata import FeatureMetadata


@dataclass(frozen=True, slots=True)
class FeatureDiscoveryQuery:
    """An immutable feature-discovery query."""

    text: str | None
    classification: FeatureClassification | None
    active_only: bool


@dataclass(frozen=True, slots=True)
class FeatureDiscoveryResult:
    """The immutable result of a feature-discovery query (metadata only)."""

    matches: tuple[FeatureMetadata, ...]


class FeatureDiscovery(Protocol):
    """Discovers features from the Feature Marketplace. Interface only — no storage."""

    def search(self, query: FeatureDiscoveryQuery) -> FeatureDiscoveryResult: ...
PY
freadme "$D" "discovery" \
"Define FeatureDiscoveryQuery, FeatureDiscoveryResult, and the FeatureDiscovery interface: discovery over the Feature Marketplace." \
"Expose discovery of accepted features by text/classification; hold no storage." \
"Consumes metadata/classification; backed by the Feature Registry/Marketplace." \
"feature_service.classification, feature_service.metadata." \
"CLAUDE.md (DP-1, FA-4); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$SRC/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Validation Coordination — orchestrates the Leakage Harness + structural validation.

Delegates leakage/look-ahead checking to the deterministic Leakage Harness (core_domain.feature) and
structural validation to the Validation Foundation. It asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.feature import LeakageReport
from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class FeatureValidationCoordinator(Protocol):
    """Coordinates a feature's validation before APPROVED/ACTIVE. Interface only.

    The Leakage Harness (deterministic) must pass (FA-2, P2-03); structural validation is orchestrated
    via the Validation Foundation; the service never computes features and never asserts significance.
    """

    def request_leakage_check(self, feature: EntityId) -> LeakageReport: ...
    def request_validation(self, feature: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, feature: EntityId) -> ValidationReport: ...
PY
freadme "$D" "validation_coordination" \
"Define FeatureValidationCoordinator: orchestrate the deterministic Leakage Harness and structural validation (Validation Foundation) before approval/activation." \
"Coordinate leakage clearance (must pass, FA-2) and structural validation; defer significance to the deterministic engine; assert no significance; hold no computation." \
"core_domain.feature (LeakageReport, LeakageHarness); core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport)." \
"Uses the Validation Foundation for orchestration; gates the transition to APPROVED." \
"CLAUDE.md (FA-2, PIT-3, AI-2, DE-1, VS-2); Architecture V2 §5.5, §5.6, §6.3; RB-09/10 · FAR; RB-04 · VAL; P1-06, P2-03."

# ===========================================================================
# registry_integration
# ===========================================================================
D="$SRC/registry_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Registry Integration — the port to the Feature Registry / Marketplace (no persistence).

Integrates with the Feature Registry (FRG): register-before-use, immutable/versioned entries, and
Marketplace publication. Delegates to core_domain.feature repositories; no storage here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.model import Feature


class FeatureRegistryPort(Protocol):
    """The port to the Feature Registry. Interface only — the concrete registry stores elsewhere.

    Registration is append-only and immutable; a change creates a new version (FA-4). Publication to
    the Marketplace requires an accepted (leakage-clean, provenanced) feature.
    """

    def register(self, feature: Feature) -> None: ...
    def publish_to_marketplace(self, feature: EntityId) -> None: ...
    def is_registered(self, feature: EntityId) -> bool: ...
PY
freadme "$D" "registry_integration" \
"Define FeatureRegistryPort: the integration port to the Feature Registry / Marketplace." \
"Integrate register-before-use, immutable/versioned registration and Marketplace publication as an interface; hold no persistence." \
"Consumed by registration/management; delegates to core_domain.feature repositories and the Feature Registry." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (FA-1..4, CP-2/7); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# approval
# ===========================================================================
D="$SRC/approval"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Approval — the approval INTERFACE (approval follows deterministic validation, not AI)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class FeatureApprovalService(Protocol):
    """Approves a feature for activation AFTER the deterministic Leakage Harness + validation gate pass.

    Approval records a deterministic-gate outcome (and, where required, a human sign-off, HO-2); it
    never adjudicates significance and no AI approves (AI-3). Interface only.
    """

    def approve(self, feature: EntityId) -> None: ...
    def reject(self, feature: EntityId, reason: str) -> None: ...
PY
freadme "$D" "approval" \
"Define FeatureApprovalService: approve/reject a feature after the deterministic validation gate." \
"Record approval as a gate outcome (with human sign-off where required); never adjudicate significance; no AI approves; hold no logic." \
"Consumed by lifecycle/management; follows validation_coordination." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (AI-3, HO-2, DE-1, FA-5); Architecture V2 §5.5, §6.2, §6.3; RB-09/10 · FAR; P2-03/09."

# ===========================================================================
# management
# ===========================================================================
D="$SRC/management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Management — the Feature Service application/orchestration INTERFACES (no adjudication).

Orchestrates the feature lifecycle and connects Data Platform/Research/Experiment/Validation/Feature
Registry. It ORCHESTRATES and RECORDS; it NEVER computes features and NEVER adjudicates (CP-5, AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.dependencies import FeatureDependency
from feature_service.metadata import FeatureMetadata
from feature_service.model import Feature


class FeatureService(Protocol):
    """The Feature Service (interface only): drive the lifecycle of a feature."""

    def register(self, feature: Feature) -> EntityId: ...
    def implement(self, feature: EntityId) -> None: ...
    def submit_for_validation(self, feature: EntityId) -> None: ...
    def approve(self, feature: EntityId) -> None: ...
    def activate(self, feature: EntityId) -> None: ...
    def deprecate(self, feature: EntityId) -> None: ...
    def archive(self, feature: EntityId) -> None: ...


class FeatureManagementService(Protocol):
    """Orchestrates dependencies/lineage and records deterministic gate outcomes. Interface only."""

    def declare_dependency(self, feature: EntityId, dependency: FeatureDependency) -> None: ...
    def record_validation_outcome(self, feature: EntityId, passed: bool) -> None: ...


class FeatureCatalogService(Protocol):
    """Describes features from the catalog/marketplace. Interface only."""

    def describe(self, feature: EntityId) -> FeatureMetadata: ...
PY
freadme "$D" "management" \
"Define the Feature Service interfaces: FeatureService (lifecycle), FeatureManagementService (dependency/lineage/gate orchestration), FeatureCatalogService." \
"Orchestrate the feature lifecycle and connect Data Platform/Research/Experiment/Validation/Feature Registry; record (never compute) deterministic gate outcomes; hold no adjudication, statistics, or feature calculation." \
"Top-level module: composes model, dependencies, metadata, registration, versioning, validation/registry integration." \
"core_domain.shared (EntityId); model; dependencies; metadata." \
"CLAUDE.md (CP-5, AI-2, AD-3, DE-1, FA-1..5); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; P1-06, P2-03/07."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Policies — deterministic policy INTERFACES governing features (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class FeaturePolicy(Protocol):
    """Marker for a deterministic, versioned feature policy."""

    ...


class AsOfComputationPolicy(Protocol):
    """A feature is computed only through the as-of path; no look-ahead (FA-1, PIT-3). Interface only."""

    def is_as_of_only(self, feature: EntityId) -> bool: ...


class LeakageClearancePolicy(Protocol):
    """A feature is accepted only after the deterministic Leakage Harness passes (FA-2, P2-03). Interface only."""

    def is_leakage_clean(self, feature: EntityId) -> bool: ...


class ProvenanceRequiredPolicy(Protocol):
    """No feature without full provenance and a Run Manifest (FA-3, DP-3). Interface only."""

    def has_provenance(self, feature: EntityId) -> bool: ...


class ImmutabilityPolicy(Protocol):
    """A feature version is immutable; a change creates a new version (FA-4, CP-2). Interface only."""

    def is_mutation_allowed(self, feature: EntityId) -> bool: ...
PY
freadme "$D" "policies" \
"Define the deterministic feature policy interfaces: FeaturePolicy, AsOfComputationPolicy, LeakageClearancePolicy, ProvenanceRequiredPolicy, ImmutabilityPolicy." \
"Express the feature-acceptance rules (as-of computation, leakage clearance, provenance-required, immutability) as interfaces; hold no logic." \
"Enforced by deterministic engines; consumed by management." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (FA-1..4, PIT-3, DP-3, CP-2, DE-1); Architecture V2 §5.5, §5.8; RB-09/10 · FAR; P1-06, P2-03."

# ===========================================================================
# specifications
# ===========================================================================
D="$SRC/specifications"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Specifications — composable STRUCTURAL predicates over features (no statistics).

These check structural readiness/acceptance prerequisites (declared, provenanced, leakage-report
present), NOT statistical significance — significance/promotion are the deterministic engine's decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TFeature = TypeVar("TFeature", contravariant=True)


class FeatureSpecification(Protocol[TFeature]):
    """A composable, deterministic structural predicate over a feature. Interface only."""

    def is_satisfied_by(self, feature: TFeature) -> bool: ...


class ReadyForValidationSpecification(Protocol[TFeature]):
    """Structural readiness for validation (registered, implemented, declarative definition, provenance).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, feature: TFeature) -> bool: ...


class AcceptancePrerequisiteSpecification(Protocol[TFeature]):
    """Structural prerequisites for acceptance (leakage-report present + clean, provenance, versioned).

    The acceptance DECISION is the deterministic Leakage Harness / validation gate's, not this. Interface only.
    """

    def is_satisfied_by(self, feature: TFeature) -> bool: ...
PY
freadme "$D" "specifications" \
"Define composable STRUCTURAL feature specifications: FeatureSpecification, ReadyForValidationSpecification, AcceptancePrerequisiteSpecification." \
"Express reusable, composable structural readiness/acceptance predicates; never judge significance or decide acceptance; hold no logic." \
"Composed by management; the acceptance decision is the deterministic Leakage Harness/validation gate's." \
"Standard library only." \
"CLAUDE.md (DE-1, AI-2, FA-2, SE-3); Architecture V2 §5.5, §5.6, §6.3; RB-09/10 · FAR; P2-03."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Domain Events — immutable facts about a feature (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class FeatureRegistered(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureVersionCreated(DomainEvent):
    feature_id: EntityId
    version: str


@dataclass(frozen=True, slots=True)
class FeatureValidated(DomainEvent):
    """Records that the deterministic Leakage Harness + validation gate passed (FA-2)."""

    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureApproved(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureActivated(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureDeprecated(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureArchived(DomainEvent):
    feature_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureDependencyAdded(DomainEvent):
    feature_id: EntityId
    dependency_id: EntityId


@dataclass(frozen=True, slots=True)
class FeatureLineageUpdated(DomainEvent):
    feature_id: EntityId
PY
freadme "$D" "events" \
"Define the canonical feature domain events: FeatureRegistered, FeatureVersionCreated, FeatureValidated, FeatureApproved, FeatureActivated, FeatureDeprecated, FeatureArchived, FeatureDependencyAdded, FeatureLineageUpdated." \
"Represent feature lifecycle facts as immutable domain events; FeatureValidated records a deterministic-engine outcome, it does not assert it." \
"core_domain.shared (DomainEvent, EntityId); align with core_domain.feature events." \
"Published to the bus/audit." \
"CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.5, §5.10; RB-09/10 · FAR; Feature Registry."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Errors — Feature Service domain errors (each expresses a violated feature invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class FeatureError(DomainError):
    """Base for Feature Service errors."""


class FeatureNotRegistered(FeatureError):
    """A feature was used/published before registration (register-before-use, FA-1)."""


class LeakageNotCleared(FeatureError):
    """A feature was approved/activated before the Leakage Harness passed (FA-2, P2-03)."""


class LookAheadComputation(FeatureError):
    """A feature was defined with look-ahead / full-sample statistics (PIT-3, FB-7)."""


class MissingFeatureProvenance(FeatureError):
    """A feature lacks full provenance / a Run Manifest (FA-3, FB-11)."""


class ImmutableVersionMutation(FeatureError):
    """An attempt to mutate an immutable feature version (FA-4, CP-2)."""


class FeatureSelfAdjudication(FeatureError):
    """The Feature Service attempted to adjudicate significance/acceptance (separation of powers, CP-5)."""


class IsolationBarrierBreach(FeatureError):
    """Generation observed validation/OOS outcomes (AD-3, P2-07)."""


class IllegalFeatureTransition(FeatureError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(FeatureError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
PY
freadme "$D" "errors" \
"Define the Feature Service errors: FeatureNotRegistered, LeakageNotCleared, LookAheadComputation, MissingFeatureProvenance, ImmutableVersionMutation, FeatureSelfAdjudication, IsolationBarrierBreach, IllegalFeatureTransition, UndeclaredDependency." \
"Express violated feature invariants (register-before-use, leakage clearance, PIT, provenance, immutability, separation of powers, isolation, lifecycle, declared dependencies) as errors." \
"Used across the Feature Service modules." \
"core_domain.shared (DomainError)." \
"CLAUDE.md (FA-1..4, PIT-3, CP-2/5/6, AD-3, FB-7/11, SE-2); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; P1-06, P2-03/07."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Feature Repository Interfaces — append-only, immutable repositories (no persistence).

The Feature Marketplace read path is core_domain.feature.FeatureMarketplace; these platform
repositories add version/lineage/dependency retrieval. No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from feature_service.dependencies import FeatureDependency
from feature_service.lineage import FeatureLineage
from feature_service.model import Feature
from feature_service.versioning import FeatureVersion


class FeatureRepositoryContract(Protocol):
    """Append-only repository of features (immutable; supersede, never mutate, CP-2, FA-4)."""

    def get(self, feature: EntityId) -> Feature: ...
    def add(self, feature: Feature) -> None: ...


class FeatureVersionRepository(Protocol):
    """Append-only repository of immutable feature versions."""

    def get(self, version: EntityId) -> FeatureVersion: ...
    def add(self, version: FeatureVersion) -> None: ...


class FeatureLineageRepository(Protocol):
    """Retrieval of a feature's complete lineage. Interface only."""

    def lineage_of(self, feature: EntityId) -> FeatureLineage: ...


class FeatureDependencyRepository(Protocol):
    """Retrieval of a feature's declared dependencies. Interface only."""

    def dependencies_of(self, feature: EntityId) -> tuple[FeatureDependency, ...]: ...
PY
freadme "$D" "repositories" \
"Define the Feature Service repository interfaces: FeatureRepositoryContract (append-only), FeatureVersionRepository, FeatureLineageRepository, FeatureDependencyRepository." \
"Express append-only, immutable retrieval of features, versions, lineage, and dependencies as interfaces; hold no persistence; the Marketplace read path is core_domain.feature.FeatureMarketplace." \
"Consumed by management; complements core_domain.feature repositories and the Feature Registry." \
"core_domain.shared (EntityId); model; versioning; lineage; dependencies." \
"CLAUDE.md (CP-2, FA-4, DP-1); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry."

echo "Feature Service generated."
