#!/usr/bin/env bash
#
# generate_data_platform.sh — Phase 2.0 Data Platform (dataset-service) generator.
#
# Governed by: CLAUDE.md (DI-1..3, DP-1..3, PIT-1..4, CP-2/6/7, SEC-2, RP-4); Architecture V2 §5.8
#              (Data Platform Layer), §6.4 (Data Boundary); Implementation Roadmap Phase 2; RB-06/07
#              · DATA, RB-08 · PIT; Dataset Governance; P1-01. Built on Phase 1 foundations.
#
# Emits the Data Platform module under services/dataset-service as `dataset_service`: the dataset
# catalog, registry, metadata, schema, versioning, lifecycle, discovery, lineage, policies, access
# control, and validation integration — plus the canonical models, domain events, errors, and
# repository/service INTERFACES. It reuses core_domain (dataset context + shared kernel), the
# platform contracts, and the validation foundation; it does NOT duplicate them.
#
# It contains NO ingestion adapters, NO storage engines, NO databases, NO APIs, NO external
# connectors, NO persistence. Deterministic, technology-independent, immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
SVC="$ROOT/services/dataset-service"
SRC="$SVC/src/dataset_service"
cd "$ROOT"

dsreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 relationships 6 dependencies 7 gov
  cat > "$1/README.md" <<EOF
# dataset-service · $2

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

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
# dataset-service — the Data Platform canonical module (Phase 2.0).
# Standard library + Phase-1 foundations only. No ingestion/storage/database/API/connector deps.
[project]
name = "dataset-service"
version = "0.1.0"
description = "Data Platform: dataset catalog, registry, metadata, schema, lifecycle, lineage, policies."
requires-python = ">=3.12"
dependencies = ["core-domain", "platform-contracts", "platform-validation"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/dataset_service"]
TOML

cat > "$SVC/service.contract.placeholder.md" <<'MD'
# dataset-service — Data Platform implemented in Phase 2.0

This service now contains the Data Platform canonical module (the `dataset_service` package): dataset
catalog, registry, metadata, schema, versioning, lifecycle, discovery, lineage, policies, access
control, and validation integration, plus canonical models, domain events, errors, and repository/
service interfaces. Ingestion adapters, storage engines, databases, APIs, external connectors, and
persistence remain forbidden here — they plug in behind these interfaces in later work.
MD

cat > "$SRC/__init__.py" <<'PY'
"""dataset_service — the Data Platform: the authoritative source of all research data.

Responsible for dataset registration, catalog, metadata, schema governance, versioning, lifecycle,
lineage, discovery, access policies, and validation integration — as technology-independent module
code that reuses the Phase-1 foundations (core_domain, platform_contracts, platform_validation).

All historical reads are served point-in-time through the As-Of Gateway (core_domain.dataset.
AsOfGateway); this module never reads ambiently and never exposes raw/uncertified/OOS data (DI-1,
PIT-1). Boundaries: no ingestion adapters, no storage engines, no databases, no APIs, no external
connectors, no persistence.

Modules: model, metadata, schema, versioning, lifecycle, catalog, registry, discovery, lineage,
policies, access_control, validation_integration, events, errors, repositories, services.
"""
from __future__ import annotations

from . import (
    access_control,
    catalog,
    discovery,
    errors,
    events,
    lifecycle,
    lineage,
    metadata,
    model,
    policies,
    registry,
    repositories,
    schema,
    services,
    validation_integration,
    versioning,
)

__all__ = [
    "model", "metadata", "schema", "versioning", "lifecycle", "catalog", "registry", "discovery",
    "lineage", "policies", "access_control", "validation_integration", "events", "errors",
    "repositories", "services",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Lifecycle — the canonical lifecycle states, transitions, and the lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class DatasetLifecycle(Enum):
    """The canonical dataset lifecycle."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    VALIDATING = "validating"
    VALIDATED = "validated"
    PUBLISHED = "published"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


L = DatasetLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[DatasetLifecycle, DatasetLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.VALIDATING),
    (L.VALIDATING, L.VALIDATED),
    (L.VALIDATING, L.REGISTERED),   # validation not yet passed -> back to registered
    (L.VALIDATED, L.PUBLISHED),
    (L.PUBLISHED, L.DEPRECATED),
    (L.DEPRECATED, L.ARCHIVED),
    # a new version of a published dataset re-enters validation (version upgrade / schema evolution)
    (L.PUBLISHED, L.VALIDATING),
)

#: Terminal state.
TERMINAL_STATES: frozenset[DatasetLifecycle] = frozenset({L.ARCHIVED})


class DatasetLifecycleService(Protocol):
    """Governs lifecycle transitions; a transition to VALIDATED/PUBLISHED requires the deterministic
    certification/validation gate to have passed (DI-1). Interface only — no logic here."""

    def transition(self, dataset: EntityId, to: DatasetLifecycle) -> None: ...
PY
dsreadme "$D" "lifecycle" \
"Define DatasetLifecycle (PROPOSED/REGISTERED/VALIDATING/VALIDATED/PUBLISHED/DEPRECATED/ARCHIVED), the canonical transitions (incl. version-upgrade revalidation), and the lifecycle-service interface." \
"Enumerate the lifecycle and its legal transitions as data; publication requires a passed certification gate; hold no logic." \
"Consumed by model, registry, policies, services." \
"core_domain.shared (EntityId); standard library." \
"CLAUDE.md (DI-1, CP-2, RL-1); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# schema
# ===========================================================================
D="$SRC/schema"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Schema — the declarative dataset schema and governed schema evolution (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import SchemaVersion


class FieldType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    TIMESTAMP = "timestamp"
    DECIMAL = "decimal"
    CATEGORY = "category"


@dataclass(frozen=True, slots=True)
class SchemaField:
    """One declarative field of a dataset schema."""

    name: str
    type: FieldType
    nullable: bool


@dataclass(frozen=True, slots=True)
class DatasetSchema:
    """An immutable, versioned dataset schema."""

    name: str
    version: SchemaVersion
    fields: tuple[SchemaField, ...]


class SchemaEvolutionKind(Enum):
    ADD_OPTIONAL_FIELD = "add_optional_field"
    DEPRECATE_FIELD = "deprecate_field"
    WIDEN_TYPE = "widen_type"
    DROP_FIELD = "drop_field"          # breaking
    NARROW_TYPE = "narrow_type"        # breaking


@dataclass(frozen=True, slots=True)
class SchemaEvolution:
    """A governed schema change; breaking changes bump the major version and preserve history (VER-2)."""

    from_version: SchemaVersion
    to_version: SchemaVersion
    kind: SchemaEvolutionKind
    backward_compatible: bool
PY
dsreadme "$D" "schema" \
"Define DatasetSchema, SchemaField, FieldType, SchemaEvolution, and SchemaEvolutionKind: the declarative schema and governed evolution model." \
"Describe dataset shape and schema evolution as immutable, versioned data; historical schemas remain interpretable; hold no logic." \
"Consumed by versioning, metadata, validation_integration." \
"platform_contracts.common (SchemaVersion); standard library." \
"CLAUDE.md (VER-1/2, CP-2, DP-1); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Model — the canonical Data Platform models (catalog view; data only).

These compose with the core domain (core_domain.dataset.Dataset is the certified domain aggregate);
here the platform adds catalog/registry attributes. Cross-references are by identity.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Version

from dataset_service.lifecycle import DatasetLifecycle


class SensitivityClass(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    CROWN_JEWEL = "crown_jewel"  # factor/alpha-adjacent data under need-to-know (SEC-2)


class DataClassificationKind(Enum):
    MARKET = "market"
    REFERENCE = "reference"
    FUNDAMENTAL = "fundamental"
    ALTERNATIVE = "alternative"
    DERIVED = "derived"


@dataclass(frozen=True, slots=True)
class DatasetIdentifier:
    """A stable, versioned identity for a dataset (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class DatasetClassification:
    """The kind and sensitivity of a dataset (drives access control, SEC-2)."""

    kind: DataClassificationKind
    sensitivity: SensitivityClass


@dataclass(frozen=True, slots=True)
class DatasetOwnership:
    """The accountable owner and steward roles for a dataset (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


@dataclass(frozen=True, slots=True)
class DatasetStatus:
    """The current lifecycle status of a dataset (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: DatasetLifecycle
    since: str


@dataclass(frozen=True, slots=True)
class DatasetVersion:
    """An immutable, content-addressed dataset version (CP-2)."""

    dataset_id: DatasetIdentifier
    content: ContentAddress
    provenance: Provenance


@dataclass(eq=False)
class Dataset(AggregateRoot):
    """The Data Platform catalog model of a dataset (aggregate root).

    Point-in-time-served, survivorship-safe, provenance-bearing (DI-1, PIT-1/2). It references the
    certified domain aggregate (core_domain.dataset.Dataset) by identity and adds catalog attributes.
    """

    identifier: DatasetIdentifier
    classification: DatasetClassification
    ownership: DatasetOwnership
    status: DatasetStatus
    provenance: Provenance
PY
dsreadme "$D" "model" \
"Define the canonical Data Platform models: Dataset, DatasetVersion, DatasetIdentifier, DatasetStatus, DatasetClassification, DatasetOwnership, and the classification enums." \
"Represent the platform (catalog) view of a dataset as immutable, versioned, provenance-bearing data; reference the certified domain aggregate by identity; hold no logic." \
"Consumed by every other Data Platform module." \
"core_domain.shared (AggregateRoot, ContentAddress, Provenance, Version); lifecycle." \
"CLAUDE.md (DI-1, DP-1/3, PIT-1/2, CP-2/7, SEC-2, NM-2); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance; P1-01."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Metadata — the immutable, auditable metadata of a dataset (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from dataset_service.model import (
    DatasetClassification,
    DatasetIdentifier,
    DatasetOwnership,
    DatasetStatus,
)


@dataclass(frozen=True, slots=True)
class DatasetMetadata:
    """Immutable catalog metadata for a dataset (auditable, provenance-bearing)."""

    identifier: DatasetIdentifier
    description: str
    classification: DatasetClassification
    ownership: DatasetOwnership
    status: DatasetStatus
    provenance: Provenance
    tags: tuple[str, ...]
PY
dsreadme "$D" "metadata" \
"Define DatasetMetadata: the immutable, auditable, provenance-bearing catalog metadata of a dataset." \
"Carry dataset metadata (identity, description, classification, ownership, status, provenance, tags) as data; hold no logic." \
"Consumed by catalog, discovery, registry." \
"core_domain.shared (Provenance); model." \
"CLAUDE.md (DP-1/3, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# versioning
# ===========================================================================
D="$SRC/versioning"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Versioning — version-upgrade and schema-evolution INTERFACES (no logic)."""
from __future__ import annotations

from typing import Protocol

from dataset_service.model import DatasetIdentifier, DatasetVersion
from dataset_service.schema import DatasetSchema, SchemaEvolution


class VersioningPolicy(Protocol):
    """Governs how a new dataset version is derived; a version is immutable once created (CP-2)."""

    def is_compatible(self, current: DatasetSchema, candidate: DatasetSchema) -> bool: ...


class DatasetVersioningService(Protocol):
    """Creates new immutable versions and applies governed schema evolution. Interface only.

    A new version re-enters the validation lifecycle; historical versions are preserved (VER-2, RP-4).
    """

    def create_version(self, identifier: DatasetIdentifier) -> DatasetVersion: ...
    def evolve_schema(self, evolution: SchemaEvolution) -> DatasetSchema: ...
PY
dsreadme "$D" "versioning" \
"Define VersioningPolicy and DatasetVersioningService: version-upgrade and governed schema-evolution interfaces." \
"Express immutable versioning and compatible schema evolution as interfaces; a new version revalidates and history is preserved; hold no logic." \
"Consumed by services; relates to lifecycle (version upgrade re-enters VALIDATING)." \
"model (DatasetVersion, DatasetIdentifier); schema; standard library." \
"CLAUDE.md (CP-2, VER-1/2, RP-4); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# lineage
# ===========================================================================
D="$SRC/lineage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Data Lineage — the lineage model and graph INTERFACE (defect propagation; no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, LineageRef

from dataset_service.model import DatasetIdentifier


@dataclass(frozen=True, slots=True)
class LineageNode:
    """A node in the lineage graph (a dataset version)."""

    dataset: DatasetIdentifier
    lineage_ref: LineageRef


@dataclass(frozen=True, slots=True)
class LineageEdge:
    """A directed lineage edge from an upstream to a downstream dataset."""

    upstream: DatasetIdentifier
    downstream: DatasetIdentifier
    transform: str


@dataclass(frozen=True, slots=True)
class DatasetLineage:
    """Complete lineage of a dataset back toward raw sources (DP-1)."""

    node: LineageNode
    upstream: tuple[LineageEdge, ...]


class LineageGraph(Protocol):
    """The lineage graph. Interface only — no storage.

    A defect discovered in any source MUST be able to invalidate everything downstream (CP-6, DP-2).
    """

    def upstream_of(self, dataset: EntityId) -> tuple[LineageEdge, ...]: ...
    def downstream_of(self, dataset: EntityId) -> tuple[LineageEdge, ...]: ...
    def invalidate_downstream(self, dataset: EntityId) -> None: ...
PY
dsreadme "$D" "lineage" \
"Define DatasetLineage, LineageNode, LineageEdge, and the LineageGraph interface (with downstream invalidation)." \
"Model complete lineage to raw sources and enable defect propagation (a source defect invalidates downstream); hold no persistence." \
"Consumed by repositories and services; relates to the platform lineage graph." \
"core_domain.shared (EntityId, LineageRef); model." \
"CLAUDE.md (CP-6, DP-1/2, DEPR-2); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# access_control
# ===========================================================================
D="$SRC/access_control"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Access Control — least-privilege, need-to-know access policy and control INTERFACE."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import DatasetIdentifier


class AccessLevel(Enum):
    NONE = "none"
    READ = "read"
    STEWARD = "steward"
    OWNER = "owner"


@dataclass(frozen=True, slots=True)
class DatasetAccessPolicy:
    """Least-privilege access policy for a dataset.

    Crown-jewel (factor/alpha-adjacent) datasets are need-to-know with access logging (SEC-2).
    """

    dataset: DatasetIdentifier
    minimum_level: AccessLevel
    need_to_know: bool


class AccessControl(Protocol):
    """Deterministically decides whether a principal may access a dataset at a level. Interface only.

    Access is default-deny; enforcement is deterministic, never AI-policed (AV2-25).
    """

    def is_allowed(self, principal: str, dataset: EntityId, level: AccessLevel) -> bool: ...
PY
dsreadme "$D" "access_control" \
"Define DatasetAccessPolicy, AccessLevel, and the AccessControl interface: least-privilege, need-to-know dataset access." \
"Express default-deny, need-to-know access (crown-jewel data restricted) as policy + interface; enforcement is deterministic; hold no logic." \
"Consumed by services and the security spine." \
"core_domain.shared (EntityId); model." \
"CLAUDE.md (SEC-2, SEC-3, AV2-25); Architecture V2 §5.8, §6.5; RB-27 · SEC; Dataset Governance."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Policies — deterministic platform policy INTERFACES (retention, immutability, PIT)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lifecycle import DatasetLifecycle


class DatasetPolicy(Protocol):
    """Marker for a deterministic, versioned dataset policy."""

    ...


class RetentionPolicy(Protocol):
    """Reproducibility-critical datasets are never garbage-collected (RP-4, P5-01). Interface only."""

    def may_archive(self, dataset: EntityId) -> bool: ...


class ImmutabilityPolicy(Protocol):
    """A published dataset version is immutable; a change creates a new version (CP-2). Interface only."""

    def is_mutation_allowed(self, status: DatasetLifecycle) -> bool: ...


class PointInTimePolicy(Protocol):
    """All historical reads are as-of and survivorship-safe (PIT-1/2). Interface only."""

    def requires_as_of(self) -> bool: ...
    def requires_survivorship_safety(self) -> bool: ...
PY
dsreadme "$D" "policies" \
"Define the deterministic dataset policy interfaces: DatasetPolicy, RetentionPolicy, ImmutabilityPolicy, PointInTimePolicy." \
"Express the platform rules (retention of reproducibility-critical data, published-version immutability, as-of + survivorship safety) as interfaces; hold no logic." \
"Consumed by lifecycle and services; enforced deterministically." \
"core_domain.shared (EntityId); lifecycle." \
"CLAUDE.md (RP-4, CP-2, PIT-1/2, SC-2); Architecture V2 §5.8; RB-08 · PIT; Dataset Governance; P5-01."

# ===========================================================================
# catalog
# ===========================================================================
D="$SRC/catalog"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Catalog — the authoritative catalog INTERFACE over registered datasets (no storage)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import DatasetClassification, DatasetIdentifier


@dataclass(frozen=True, slots=True)
class CatalogEntry:
    """An immutable catalog entry: a dataset identity + its metadata."""

    identifier: DatasetIdentifier
    metadata: DatasetMetadata


class DatasetCatalog(Protocol):
    """The authoritative catalog of datasets. Interface only — no storage/persistence here."""

    def get(self, identifier: DatasetIdentifier) -> CatalogEntry: ...
    def list_by_classification(self, classification: DatasetClassification) -> tuple[CatalogEntry, ...]: ...
PY
dsreadme "$D" "catalog" \
"Define CatalogEntry and the DatasetCatalog interface: the authoritative catalog over registered datasets." \
"Expose an immutable, queryable catalog of datasets by identity and classification; hold no storage." \
"Consumed by discovery and services; backed by the registry." \
"metadata; model." \
"CLAUDE.md (DP-1, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# registry
# ===========================================================================
D="$SRC/registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Registry — the append-only, register-before-use registry INTERFACE (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lifecycle import DatasetLifecycle
from dataset_service.model import Dataset


@dataclass(frozen=True, slots=True)
class DatasetRecord:
    """An immutable registry record of a dataset's existence and current lifecycle state."""

    dataset_id: EntityId
    state: DatasetLifecycle


class DatasetRegistry(Protocol):
    """Append-only, register-before-use registry of datasets. Interface only — no persistence.

    Registration is a governed transition; no dataset is served before it is registered (DP-1).
    """

    def get(self, dataset: EntityId) -> DatasetRecord: ...
    def register(self, dataset: Dataset) -> None: ...
PY
dsreadme "$D" "registry" \
"Define DatasetRecord and the DatasetRegistry interface: the append-only, register-before-use inventory of datasets." \
"Express register-before-use, immutable dataset existence/status as an interface; hold no persistence." \
"Consumed by catalog and services; parallels the six platform registries." \
"core_domain.shared (EntityId); lifecycle; model." \
"CLAUDE.md (DP-1, CP-2/7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# discovery
# ===========================================================================
D="$SRC/discovery"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Discovery — the discovery/query INTERFACE over the catalog (no storage)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import DataClassificationKind, SensitivityClass


@dataclass(frozen=True, slots=True)
class DiscoveryQuery:
    """An immutable discovery query (text and/or classification filters)."""

    text: str | None
    kind: DataClassificationKind | None
    max_sensitivity: SensitivityClass | None  # never surfaces data above the caller's clearance (SEC-2)


@dataclass(frozen=True, slots=True)
class DiscoveryResult:
    """The immutable result of a discovery query (metadata only, access-filtered)."""

    matches: tuple[DatasetMetadata, ...]


class DatasetDiscovery(Protocol):
    """Searches the catalog subject to access control (default-deny). Interface only."""

    def search(self, query: DiscoveryQuery) -> DiscoveryResult: ...
PY
dsreadme "$D" "discovery" \
"Define DiscoveryQuery, DiscoveryResult, and the DatasetDiscovery interface: access-filtered dataset discovery over the catalog." \
"Expose search/discovery that never surfaces data above the caller's clearance; hold no storage." \
"Consumes the catalog; enforces access control." \
"metadata; model." \
"CLAUDE.md (SEC-2, DP-1); Architecture V2 §5.8, §6.5; Dataset Governance."

# ===========================================================================
# validation_integration
# ===========================================================================
D="$SRC/validation_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Validation Integration — bridges the platform to the Validation Foundation & certification.

STRUCTURAL validation uses the Validation Foundation; data-quality CERTIFICATION and survivorship/
leakage checks are the deterministic engines' domain (RB-06/07). No statistical significance here (AI-2).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class DatasetStructuralValidation(Protocol):
    """Runs structural validation of a dataset via the Validation Foundation. Interface only.

    Structural/schema validation only; it asserts NO statistical significance and issues NO
    certification verdict (that is the deterministic certification engine, DI-1).
    """

    def validate_structure(self, dataset: EntityId, context: ValidationContext) -> ValidationReport: ...


class DatasetCertificationGate(Protocol):
    """The deterministic certification gate a dataset must pass before VALIDATED/PUBLISHED. Interface only.

    Delegates to the deterministic certification/quality engine (RB-06/07); the platform never
    certifies data with an LLM or by convention.
    """

    def is_certified(self, dataset: EntityId) -> bool: ...
PY
dsreadme "$D" "validation_integration" \
"Define DatasetStructuralValidation (bridge to the Validation Foundation) and DatasetCertificationGate (bridge to the deterministic certification engine)." \
"Integrate structural validation and defer data-quality certification to the deterministic engine; assert no statistical significance; hold no logic." \
"Consumes platform_validation and (conceptually) core_domain.dataset.CertificationService; used by services." \
"platform_validation (ValidationContext, ValidationReport); core_domain.shared (EntityId)." \
"CLAUDE.md (DI-1, AI-2, DE-1, VS-2); Architecture V2 §5.8, §5.6; RB-06/07 · DATA; RB-04 · VAL; P2-03."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Domain Events — immutable facts about a dataset (subclass the domain event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class DatasetRegistered(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidated(DomainEvent):
    """The dataset passed the deterministic certification/validation gate (DI-1)."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetPublished(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetDeprecated(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetArchived(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetVersionCreated(DomainEvent):
    dataset_id: EntityId
    version: str


@dataclass(frozen=True, slots=True)
class DatasetSchemaUpdated(DomainEvent):
    dataset_id: EntityId
    schema_version: str


@dataclass(frozen=True, slots=True)
class DatasetOwnershipTransferred(DomainEvent):
    dataset_id: EntityId
    from_role: str
    to_role: str
PY
dsreadme "$D" "events" \
"Define the canonical dataset domain events: DatasetRegistered, DatasetValidated, DatasetPublished, DatasetDeprecated, DatasetArchived, DatasetVersionCreated, DatasetSchemaUpdated, DatasetOwnershipTransferred." \
"Represent dataset lifecycle facts as immutable domain events carrying the domain event envelope; records, not commands." \
"Published to the bus/audit; align with core_domain.dataset events." \
"core_domain.shared (DomainEvent, EntityId)." \
"CLAUDE.md (CP-2/7); Architecture V2 §5.8, §5.10; Dataset Governance."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Errors — Data Platform domain errors (each expresses a violated data invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class DatasetError(DomainError):
    """Base for Data Platform errors."""


class DatasetNotRegistered(DatasetError):
    """A dataset was used/served before registration (register-before-use, DP-1)."""


class NonAsOfDatasetRead(DatasetError):
    """A historical dataset read was attempted without an as-of (PIT-1, fail-closed)."""


class ImmutableVersionMutation(DatasetError):
    """An attempt to mutate a published, immutable dataset version (CP-2)."""


class UncertifiedDatasetPublished(DatasetError):
    """An attempt to publish a dataset that has not passed certification (DI-1)."""


class SurvivorshipUnsafe(DatasetError):
    """A dataset/universe was certified or served survivorship-unsafe (FB-7)."""


class LineageDefect(DatasetError):
    """A source defect requires invalidation of downstream datasets (CP-6, DP-2)."""


class DatasetAccessDenied(DatasetError):
    """Access to a dataset was denied by least-privilege/need-to-know policy (SEC-2)."""


class IllegalDatasetTransition(DatasetError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
PY
dsreadme "$D" "errors" \
"Define the Data Platform errors: DatasetNotRegistered, NonAsOfDatasetRead, ImmutableVersionMutation, UncertifiedDatasetPublished, SurvivorshipUnsafe, LineageDefect, DatasetAccessDenied, IllegalDatasetTransition." \
"Express violated data invariants (register-before-use, as-of, immutability, certification, survivorship, lineage, access, lifecycle) as errors." \
"Used across the Data Platform modules." \
"core_domain.shared (DomainError)." \
"CLAUDE.md (DP-1, PIT-1, CP-2/6, DI-1, FB-7, SEC-2); Architecture V2 §5.8; RB-06/07 · DATA; RB-08 · PIT."

# ===========================================================================
# repositories
# ===========================================================================
D="$SRC/repositories"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Repository Interfaces — append-only, immutable repositories (no persistence).

The domain read path (point-in-time) is core_domain.dataset.AsOfGateway; these platform repositories
add catalog/version/lineage retrieval. No storage engine, database, or persistence here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lineage import DatasetLineage
from dataset_service.model import Dataset, DatasetVersion


class DatasetRepositoryContract(Protocol):
    """Append-only repository of dataset aggregates (immutable; supersede, never mutate, CP-2)."""

    def get(self, dataset: EntityId) -> Dataset: ...
    def add(self, dataset: Dataset) -> None: ...


class DatasetVersionRepository(Protocol):
    """Append-only repository of immutable dataset versions."""

    def get(self, version: EntityId) -> DatasetVersion: ...
    def add(self, version: DatasetVersion) -> None: ...


class LineageRepository(Protocol):
    """Retrieval of a dataset's complete lineage. Interface only."""

    def lineage_of(self, dataset: EntityId) -> DatasetLineage: ...
PY
dsreadme "$D" "repositories" \
"Define the Data Platform repository interfaces: DatasetRepositoryContract, DatasetVersionRepository, LineageRepository." \
"Express append-only, immutable retrieval of datasets, versions, and lineage as interfaces; hold no persistence; the PIT read path is the As-Of Gateway." \
"Consumed by services; complements core_domain.dataset.DatasetRepository/AsOfGateway." \
"core_domain.shared (EntityId); model; lineage." \
"CLAUDE.md (CP-2, PIT-1, DP-1); Architecture V2 §5.8, §6.4; RB-08 · PIT; P1-01."

# ===========================================================================
# services
# ===========================================================================
D="$SRC/services"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Service Interfaces — the Data Platform application service (orchestration; no adjudication).

These interfaces orchestrate registration -> certification/validation -> publication via deterministic
gates; they perform NO adjudication, NO ingestion, NO storage, NO persistence, NO API. Interfaces only.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import Dataset


class DatasetService(Protocol):
    """The Data Platform application service (interface only).

    Publication requires a passed deterministic certification/validation gate (DI-1); the service
    never certifies data itself and never lets AI decide.
    """

    def register(self, dataset: Dataset) -> None: ...
    def submit_for_validation(self, dataset: EntityId) -> None: ...
    def publish(self, dataset: EntityId) -> None: ...
    def deprecate(self, dataset: EntityId) -> None: ...
    def archive(self, dataset: EntityId) -> None: ...


class DatasetCatalogService(Protocol):
    """Describes datasets from the catalog. Interface only."""

    def describe(self, dataset: EntityId) -> DatasetMetadata: ...


class DatasetOwnershipService(Protocol):
    """Transfers dataset ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, dataset: EntityId, to_role: str) -> None: ...
PY
dsreadme "$D" "services" \
"Define the Data Platform service interfaces: DatasetService (register/validate/publish/deprecate/archive), DatasetCatalogService, DatasetOwnershipService." \
"Orchestrate the dataset lifecycle via deterministic gates; perform no adjudication, ingestion, storage, or persistence; hold no logic." \
"Top-level module: composes catalog, registry, lifecycle, validation_integration, versioning, events." \
"core_domain.shared (EntityId); model; metadata." \
"CLAUDE.md (DI-1, DE-1, AI-1, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

echo "Data Platform (dataset-service) generated."
