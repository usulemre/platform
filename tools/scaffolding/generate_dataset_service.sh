#!/usr/bin/env bash
#
# generate_dataset_service.sh — Phase 2.2 Dataset Service (application layer) generator.
#
# Governed by: CLAUDE.md (DI-1, DP-1, PIT-1, CP-2/7, SEC-2, RP-4, AI-2, DE-1); Architecture V2 §5.8
#              (Data Platform Layer), §6.4; Implementation Roadmap Phase 2; RB-06/07 · DATA, RB-08 ·
#              PIT; Dataset Governance; P1-01.
#
# Emits the Dataset Service APPLICATION/orchestration layer at
# services/dataset-service/src/dataset_service/application: registration, discovery, metadata,
# version management, validation coordination, access management, classification, ownership,
# lifecycle, search, plus service events and errors. It ORCHESTRATES on top of the Phase-2.0 Data
# Platform DOMAIN (dataset_service.*) and uses the Validation Foundation (platform_validation) for
# validation orchestration.
#
# It self-contains: it does NOT modify the Phase-2.0 domain output. It contains NO databases, NO
# storage, NO ingestion connectors, NO ETL, NO APIs, NO persistence, NO infrastructure, NO
# business-specific dataset logic. Deterministic, technology-independent, immutable, auditable,
# idempotent. Interfaces are placeholders.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
APP="$ROOT/services/dataset-service/src/dataset_service/application"
cd "$ROOT"

appreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 dependencies 6 relationships 7 gov
  cat > "$1/README.md" <<EOF
# dataset-service · application · $2

> **Phase 2.2 Dataset Service (application layer) — orchestration interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No storage, no database, no ingestion/ETL, no API,
> no persistence, no infrastructure. Orchestrates the Data Platform domain; it never persists or
> adjudicates.

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
# application package root
# ===========================================================================
mkdir -p "$APP"

cat > "$APP/__init__.py" <<'PY'
"""dataset_service.application — the Dataset Service application/orchestration layer (Phase 2.2).

Operates ON TOP OF the Phase-2.0 Data Platform domain (dataset_service.model/catalog/registry/
lifecycle/…) and uses the Validation Foundation (platform_validation) for validation orchestration.
It coordinates the operational dataset lifecycle — registration, validation, publication, version
promotion, deprecation, archival, and governed replacement — via deterministic gates.

Authority & boundaries: the application layer ORCHESTRATES; it never certifies data itself (that is
the deterministic certification engine, DI-1, AI-2), never persists (no storage/database here), and
never integrates external connectors. All historical reads route through the As-Of Gateway (PIT-1).

Modules: registration, discovery, search, metadata, version_management, validation_coordination,
access_management, classification, ownership, lifecycle, events, errors.
"""
from __future__ import annotations

from . import (
    access_management,
    classification,
    discovery,
    errors,
    events,
    lifecycle,
    metadata,
    ownership,
    registration,
    search,
    validation_coordination,
    version_management,
)

__all__ = [
    "registration", "discovery", "search", "metadata", "version_management",
    "validation_coordination", "access_management", "classification", "ownership", "lifecycle",
    "events", "errors",
]
PY

# ===========================================================================
# registration
# ===========================================================================
D="$APP/registration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Registration — the register-before-use registration application service & workflow."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import Dataset


class DatasetRegistrationService(Protocol):
    """Orchestrates register-before-use registration of a dataset (DP-1). Interface only.

    Delegates existence to the Data Platform registry; performs no persistence. Registration is a
    governed transition; nothing is served before it is registered.
    """

    def request_registration(self, dataset: Dataset) -> EntityId: ...
    def confirm_registration(self, dataset: EntityId) -> None: ...


class DatasetRegistrationWorkflow(Protocol):
    """Drives the registration -> validation-request stages via deterministic gates. Interface only.

    It orchestrates; every gate delegates to its owning engine. No decision logic here.
    """

    def run(self, dataset: EntityId) -> None: ...
PY
appreadme "$D" "registration" \
"Define DatasetRegistrationService and DatasetRegistrationWorkflow: the register-before-use application service and its orchestration workflow." \
"Orchestrate dataset registration and hand off to validation via deterministic gates; hold no persistence or decision logic." \
"core_domain.shared (EntityId); dataset_service.model, dataset_service.registry (domain)." \
"Consumes the Data Platform registry; precedes validation_coordination." \
"CLAUDE.md (DP-1, DE-1, CP-7); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# validation_coordination
# ===========================================================================
D="$APP/validation_coordination"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Validation Coordination — orchestrates structural validation + the certification gate.

Uses the Validation Foundation (platform_validation) for STRUCTURAL validation and delegates
data-quality CERTIFICATION to the deterministic engine (dataset_service.validation_integration).
No statistics here; certification is never asserted by an LLM (AI-2, DI-1).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class DatasetValidationCoordinator(Protocol):
    """Coordinates a dataset's structural validation and certification before VALIDATED/PUBLISHED.

    Structural validation is orchestrated via the Validation Foundation; certification/leakage/
    survivorship are the deterministic engine's decision (DI-1). Interface only.
    """

    def request_validation(self, dataset: EntityId, context: ValidationContext) -> None: ...
    def collect_report(self, dataset: EntityId) -> ValidationReport: ...
    def is_certified(self, dataset: EntityId) -> bool: ...
PY
appreadme "$D" "validation_coordination" \
"Define DatasetValidationCoordinator: orchestrates structural validation (Validation Foundation) and the deterministic certification gate before validation/publication." \
"Coordinate validation; defer certification/leakage/survivorship to the deterministic engine; assert no statistical significance; hold no logic." \
"core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport); dataset_service.validation_integration (domain gate)." \
"Uses the Validation Foundation for orchestration; gates the lifecycle transition to VALIDATED." \
"CLAUDE.md (DI-1, AI-2, DE-1, VS-2); Architecture V2 §5.8, §5.6; RB-06/07 · DATA; RB-04 · VAL; P2-03."

# ===========================================================================
# version_management
# ===========================================================================
D="$APP/version_management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Version Management — version creation, promotion, and governed dataset replacement."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import DatasetIdentifier, DatasetVersion


class DatasetVersionManagementService(Protocol):
    """Application service for dataset versions. Interface only.

    A new or promoted version re-enters validation; historical versions are preserved (CP-2, VER-2,
    RP-4). Promotion moves a validated version to PUBLISHED; replacement supersedes an old dataset
    (which is then deprecated), never mutating it.
    """

    def create_version(self, identifier: DatasetIdentifier) -> DatasetVersion: ...
    def promote_version(self, version: EntityId) -> None: ...
    def replace_dataset(self, old: EntityId, new: EntityId) -> None: ...
PY
appreadme "$D" "version_management" \
"Define DatasetVersionManagementService: version creation, version promotion, and governed dataset replacement." \
"Orchestrate immutable versioning; promotion re-validates; replacement supersedes-and-deprecates (never mutates); preserve history; hold no logic." \
"core_domain.shared (EntityId); dataset_service.model, dataset_service.versioning (domain)." \
"Coordinates with validation_coordination (new versions revalidate) and lifecycle." \
"CLAUDE.md (CP-2, VER-1/2, RP-4, DEPR-1..3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# metadata
# ===========================================================================
D="$APP/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Metadata Management — the metadata application service (read + governed update)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.metadata import DatasetMetadata


class DatasetMetadataService(Protocol):
    """Manages dataset catalog metadata. Interface only.

    Metadata is immutable/versioned; a governed update produces a new metadata version (CP-2). No
    persistence here.
    """

    def describe(self, dataset: EntityId) -> DatasetMetadata: ...
    def update_tags(self, dataset: EntityId, tags: tuple[str, ...]) -> DatasetMetadata: ...
PY
appreadme "$D" "metadata" \
"Define DatasetMetadataService: read and governed update of dataset catalog metadata." \
"Serve and version dataset metadata (updates create a new version); hold no persistence." \
"core_domain.shared (EntityId); dataset_service.metadata (domain)." \
"Consumes the Data Platform metadata/catalog." \
"CLAUDE.md (CP-2/7, DP-3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# discovery
# ===========================================================================
D="$APP/discovery"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Discovery — the catalog discovery application service (access-filtered)."""
from __future__ import annotations

from typing import Protocol

from dataset_service.discovery import DiscoveryQuery, DiscoveryResult


class DatasetDiscoveryService(Protocol):
    """Discovers datasets from the catalog subject to access control (default-deny). Interface only.

    Never surfaces data above the caller's clearance (SEC-2).
    """

    def discover(self, query: DiscoveryQuery) -> DiscoveryResult: ...
PY
appreadme "$D" "discovery" \
"Define DatasetDiscoveryService: access-filtered catalog discovery on top of the Data Platform." \
"Expose catalog discovery that respects access control; hold no storage." \
"dataset_service.discovery (domain query/result)." \
"Consumes the Data Platform catalog; complements search." \
"CLAUDE.md (SEC-2, DP-1); Architecture V2 §5.8, §6.5; Dataset Governance."

# ===========================================================================
# search
# ===========================================================================
D="$APP/search"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Search — text/faceted search over dataset metadata (access-filtered; no index engine)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import DataClassificationKind, SensitivityClass


@dataclass(frozen=True, slots=True)
class DatasetSearchQuery:
    """An immutable text/faceted search query."""

    text: str | None
    tags: tuple[str, ...]
    kind: DataClassificationKind | None
    max_sensitivity: SensitivityClass | None  # results never exceed the caller's clearance (SEC-2)


class DatasetSearchService(Protocol):
    """Searches dataset metadata, access-filtered. Interface only — no search-index engine here."""

    def search(self, query: DatasetSearchQuery) -> tuple[DatasetMetadata, ...]: ...
PY
appreadme "$D" "search" \
"Define DatasetSearchQuery and DatasetSearchService: text/faceted, access-filtered search over dataset metadata." \
"Expose search over metadata that never exceeds the caller's clearance; hold no search-index engine." \
"dataset_service.metadata, dataset_service.model (domain)." \
"Complements discovery; the concrete search index plugs in behind this interface." \
"CLAUDE.md (SEC-2, DP-1); Architecture V2 §5.8, §6.5; Dataset Governance; TDR §12."

# ===========================================================================
# access_management
# ===========================================================================
D="$APP/access_management"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Access Management — access coordination (default-deny, need-to-know)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.access_control import AccessLevel


class DatasetAccessManagementService(Protocol):
    """Coordinates dataset access decisions. Interface only.

    Default-deny and need-to-know; crown-jewel datasets restricted with access logging (SEC-2).
    Enforcement is deterministic, never AI-policed (AV2-25).
    """

    def grant(self, principal: str, dataset: EntityId, level: AccessLevel) -> None: ...
    def revoke(self, principal: str, dataset: EntityId) -> None: ...
    def check(self, principal: str, dataset: EntityId, level: AccessLevel) -> bool: ...
PY
appreadme "$D" "access_management" \
"Define DatasetAccessManagementService: grant/revoke/check dataset access, default-deny and need-to-know." \
"Coordinate deterministic, least-privilege access; hold no logic (enforcement is deterministic, never AI)." \
"core_domain.shared (EntityId); dataset_service.access_control (domain)." \
"Consumes the Data Platform access-control policy; used by discovery/search." \
"CLAUDE.md (SEC-2/3, AV2-25); Architecture V2 §5.8, §6.5; RB-27 · SEC; Dataset Governance."

# ===========================================================================
# classification
# ===========================================================================
D="$APP/classification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Classification — the classification application service (drives access control)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import DatasetClassification


class DatasetClassificationService(Protocol):
    """Assigns/updates a dataset's classification. Interface only.

    Classification drives access control (a more sensitive classification tightens access, SEC-2).
    """

    def classify(self, dataset: EntityId, classification: DatasetClassification) -> None: ...
PY
appreadme "$D" "classification" \
"Define DatasetClassificationService: assign/update dataset classification." \
"Set classification that drives access control; hold no logic." \
"core_domain.shared (EntityId); dataset_service.model (domain)." \
"Feeds access_management and discovery/search filters." \
"CLAUDE.md (SEC-2, CP-8); Architecture V2 §5.8; Dataset Governance."

# ===========================================================================
# ownership
# ===========================================================================
D="$APP/ownership"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Ownership — the ownership-transfer application service (recorded accountability)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class DatasetOwnershipService(Protocol):
    """Transfers dataset ownership with recorded accountability (CP-7, HO-1). Interface only."""

    def transfer(self, dataset: EntityId, to_role: str) -> None: ...
PY
appreadme "$D" "ownership" \
"Define DatasetOwnershipService: transfer dataset ownership with recorded accountability." \
"Coordinate ownership transfer as a recorded, interface-only operation; hold no logic." \
"core_domain.shared (EntityId); dataset_service.model (DatasetOwnership, domain)." \
"Emits DatasetOwnershipTransferred (domain) via the lifecycle/events." \
"CLAUDE.md (CP-7, HO-1); Architecture V2 §5.8; Dataset Governance."

# ===========================================================================
# lifecycle
# ===========================================================================
D="$APP/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Lifecycle — the lifecycle coordinator orchestrating operational dataset transitions."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lifecycle import DatasetLifecycle


class DatasetLifecycleCoordinator(Protocol):
    """Coordinates the operational dataset lifecycle via deterministic gates. Interface only.

    Registration -> validation -> publication -> deprecation -> archival, plus version promotion and
    governed replacement. Publication requires a passed certification gate (DI-1); transitions are
    fail-closed against the canonical set. No decision logic here.
    """

    def publish(self, dataset: EntityId) -> None: ...
    def deprecate(self, dataset: EntityId) -> None: ...
    def archive(self, dataset: EntityId) -> None: ...
    def current_state(self, dataset: EntityId) -> DatasetLifecycle: ...
PY
appreadme "$D" "lifecycle" \
"Define DatasetLifecycleCoordinator: orchestrate registration/validation/publication/deprecation/archival, version promotion, and replacement." \
"Coordinate lifecycle transitions via deterministic gates (publication requires certification); fail-closed; hold no decision logic." \
"core_domain.shared (EntityId); dataset_service.lifecycle (domain states/transitions)." \
"Ties together registration, validation_coordination, and version_management." \
"CLAUDE.md (DI-1, CP-2, DE-1, RL-1); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# events (service/application events)
# ===========================================================================
D="$APP/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Service Events — application/service-level events (incl. request signals).

These are the application-layer events of the Dataset Service (distinct from the Phase-2.0 domain
events in dataset_service.events); they include the *Requested command-signals that drive workflows.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class DatasetRegistrationRequested(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetRegistered(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidationRequested(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetValidated(DomainEvent):
    """Records that the deterministic certification/validation gate passed (DI-1)."""

    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetPublished(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetVersionPromoted(DomainEvent):
    dataset_id: EntityId
    version: str


@dataclass(frozen=True, slots=True)
class DatasetDeprecated(DomainEvent):
    dataset_id: EntityId


@dataclass(frozen=True, slots=True)
class DatasetArchived(DomainEvent):
    dataset_id: EntityId
PY
appreadme "$D" "events" \
"Define the Dataset Service events: DatasetRegistrationRequested, DatasetRegistered, DatasetValidationRequested, DatasetValidated, DatasetPublished, DatasetVersionPromoted, DatasetDeprecated, DatasetArchived." \
"Represent application/workflow signals as immutable events (incl. *Requested command-signals); DatasetValidated records a deterministic-engine outcome." \
"core_domain.shared (DomainEvent, EntityId)." \
"Application-level; distinct from and complementary to the Phase-2.0 domain events." \
"CLAUDE.md (CP-2/7, DI-1); Architecture V2 §5.8, §5.10; Dataset Governance."

# ===========================================================================
# errors (service/application errors)
# ===========================================================================
D="$APP/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Service Errors — application-layer errors of the Dataset Service."""
from __future__ import annotations

from core_domain.shared import DomainError


class DatasetServiceError(DomainError):
    """Base for Dataset Service (application-layer) errors."""


class RegistrationRejected(DatasetServiceError):
    """A registration request was rejected (e.g. duplicate or missing prerequisites, DP-1)."""


class ValidationNotCleared(DatasetServiceError):
    """Publication was attempted before the certification/validation gate passed (DI-1)."""


class VersionPromotionBlocked(DatasetServiceError):
    """A version was promoted before it passed validation (CP-2, VER-2)."""


class DatasetReplacementError(DatasetServiceError):
    """A dataset replacement violated supersede-and-deprecate semantics (CP-2, DEPR-2)."""


class AccessCoordinationDenied(DatasetServiceError):
    """An access-coordination request was denied by least-privilege/need-to-know policy (SEC-2)."""


class IllegalServiceTransition(DatasetServiceError):
    """An operational lifecycle transition not in the canonical set (fail-closed)."""
PY
appreadme "$D" "errors" \
"Define the Dataset Service errors: RegistrationRejected, ValidationNotCleared, VersionPromotionBlocked, DatasetReplacementError, AccessCoordinationDenied, IllegalServiceTransition." \
"Express application-layer failures (registration, validation-clearance, promotion, replacement, access, lifecycle) as errors." \
"core_domain.shared (DomainError)." \
"Used across the application services; complements the Phase-2.0 domain errors." \
"CLAUDE.md (DP-1, DI-1, CP-2, SEC-2, DEPR-2); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

echo "Dataset Service (application layer) generated."
