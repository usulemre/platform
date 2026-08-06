#!/usr/bin/env bash
#
# generate_storage_layer.sh — Phase 3.2 Storage Layer generator.
#
# Governed by: CLAUDE.md (CP-2 immutability, CP-4/6/7, RP-1/4, DI-3, PIT-1, SC-2, SEC-4, AV2-12);
#              Architecture V2 §5.10 (Reproducibility/Observability/Audit + Contracts spines), §6.4;
#              Implementation Roadmap Phase 2/8; RB-05 · REPRO, RB-06/07 · DATA; P1-02, P5-01, P6-03; TDR §12/§13.
#
# Emits the Storage Layer as a new shared library, `platform_storage`: storage core, providers,
# lifecycle, repository abstractions, object/metadata/artifact/dataset/snapshot storage abstractions,
# backup, archive management, retention policies, storage policies, storage validation, and the error
# model. It depends only on the platform contract kernel.
#
# It is the VENDOR/TECHNOLOGY-INDEPENDENT storage abstraction: canonical interfaces ONLY. It supports
# immutable research artifacts (CP-2), reproducible experiments (P1-02, RP-1), and governance
# traceability (CP-6/7); reproducibility-critical data is never GC'd (RP-4) and lifecycle drives
# tiering (SC-2). It contains NO database/SQL, NO object-storage/persistence, NO business logic, NO
# infrastructure. Deterministic, immutable, auditable, extensible, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/storage"
SRC="$PKG/src/platform_storage"
cd "$ROOT"

# robust README helper (order: Purpose, Responsibilities, Relationships, Dependencies, Governance)
streadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# storage · $name

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

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
# storage — the vendor-independent Storage Layer abstractions (Phase 3.2).
# Standard library + the platform contract kernel only. No database/SQL/object-storage/persistence deps.
[project]
name = "platform-storage"
version = "0.1.0"
description = "Vendor-independent storage abstractions: repository/object/artifact/dataset/snapshot interfaces."
requires-python = ">=3.12"
dependencies = ["platform-contracts"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_storage"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# storage — implemented in Phase 3.2

This shared library contains the Storage Layer (the `platform_storage` package): storage core,
providers, lifecycle, repository abstractions, object/metadata/artifact/dataset/snapshot storage
abstractions, backup, archive management, retention policies, storage policies, storage validation,
and the error model. Databases, SQL, object storage, persistence, and infrastructure remain forbidden
here. Concrete storage backends (PostgreSQL, Iceberg, ArcticDB, S3-compatible object storage, per the
TDR) plug in behind these canonical interfaces.
MD

cat > "$PKG/README.md" <<'MD'
# storage (package) — `platform_storage`

> **Phase 3.2 — Storage Layer (implemented).** The institutional abstraction for persistent storage
> used throughout the platform: storage boundaries, contracts, and capabilities — independent of any
> specific database, object storage, or file system. **Abstractions only** — no database/SQL, no
> object-storage/persistence, no infrastructure.

## Purpose
Define the vendor/technology-independent storage interfaces (AV2-12, SE-3, TDR §12/§13). Concrete
backends (PostgreSQL, an Iceberg lakehouse, ArcticDB, S3-compatible object storage) plug in **behind**
these interfaces; no core logic depends on any specific storage vendor. It maps to the cross-cutting
Reproducibility/Observability/Audit and Contracts spines (Architecture V2 §5.10) and introduces no new
top-level concept (RO-1).

## What is here (Phase 3.2)
15 modules, each a subpackage with its own `README.md`:
`core` · `providers` · `lifecycle` · `repository` · `object_storage` · `metadata_storage` ·
`artifact_storage` · `dataset_storage` · `snapshot_storage` · `backup` · `archive` · `retention` ·
`policies` · `validation` · `errors`.

- **Canonical models:** `StorageProvider`, `StorageIdentifier`, `StorageProfile`, `StoragePolicy`,
  `StorageContext`, `StorageMetadata`, `StorageArtifact`, `StorageSnapshot`, `StorageVersion`,
  `RetentionPolicy`, `ArchivePolicy`.
- **Lifecycle:** `REGISTERED → INITIALIZED → AVAILABLE → ACTIVE → ARCHIVED → RETIRED`, supporting
  versioning, snapshots, archival, recovery, and migration; skips forbidden (fail-closed).

## Boundary rules (verified)
- **Vendor/technology-independent:** standard library + the `platform_contracts` kernel only; a code
  scan confirms no database/SQL/object-storage/persistence imports.
- **Immutable research artifacts (CP-2):** `StorageArtifact`/`ArtifactStore` are content-addressed
  and append-only (supersede, never mutate); `MUTATION_FORBIDDEN` error.
- **Reproducible experiments (P1-02, RP-1):** artifacts carry a `manifest_ref`; `validation` verifies
  content-hash integrity and reproducibility; `INTEGRITY_FAILURE` error.
- **Governance traceability (CP-6/7):** `StorageMetadata` carries provenance/lineage references.
- **Retention & lifecycle (RP-4, SC-2, P5-01):** reproducibility-critical data is never GC'd
  (`RetentionPolicy` + `RETENTION_VIOLATION`); retention drives tiering, no "immutable forever, hot
  forever". PIT + vintage safety: `NON_AS_OF_READ`, `VINTAGE_OVERWRITE` errors.
- **Deterministic, immutable:** no ambient time (timestamps supplied); all models/policies are `frozen`
  dataclasses (runtime `FrozenInstanceError`); register-before-use.
- **Compiles and imports cleanly**, 15 modules, no circular dependencies.

## Ownership
Accountable role: HSRE (platform); data storage co-owned by HD; audit/security by CISO. Architecture owner: ARB.

## Dependencies
`platform_contracts.common` only.

## Regeneration
Generated by [`tools/scaffolding/generate_storage_layer.sh`](../../tools/scaffolding/generate_storage_layer.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (CP-2/4/6/7, RP-1/4, DI-3, PIT-1, SC-2, SEC-4, AV2-12); Architecture V2 §5.10, §6.4;
Implementation Roadmap Phase 2/8; RB-05 · REPRO; RB-06/07 · DATA; `P1-02`, `P5-01`, `P6-03`; TDR §12/§13.
MD

cat > "$SRC/__init__.py" <<'PY'
"""platform_storage — the vendor-independent Storage Layer.

The institutional abstraction for persistent storage used throughout the platform: it defines storage
boundaries, contracts, and capabilities while remaining independent of any specific database, object
storage, or file system (AV2-12). Concrete backends plug in behind these canonical interfaces.

Boundaries: it exposes only canonical storage interfaces. It supports immutable research artifacts
(CP-2), reproducible experiments (P1-02, RP-1), and governance traceability (CP-6/7); reproducibility-
critical data is never GC'd (RP-4) and lifecycle drives tiering (SC-2). No database/SQL, no
object-storage/persistence, no business logic, no infrastructure.

Modules: core, providers, lifecycle, repository, object_storage, metadata_storage, artifact_storage,
dataset_storage, snapshot_storage, backup, archive, retention, policies, validation, errors.
"""
from __future__ import annotations

from . import (
    archive,
    artifact_storage,
    backup,
    core,
    dataset_storage,
    errors,
    lifecycle,
    metadata_storage,
    object_storage,
    policies,
    providers,
    repository,
    retention,
    snapshot_storage,
    validation,
)

__all__ = [
    "core", "providers", "lifecycle", "repository", "object_storage", "metadata_storage",
    "artifact_storage", "dataset_storage", "snapshot_storage", "backup", "archive", "retention",
    "policies", "validation", "errors",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# core
# ===========================================================================
D="$SRC/core"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Storage Core — the canonical storage identity, profile, context, classes, and provider port."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import CorrelationId, SchemaVersion


class StorageClass(Enum):
    """Storage tier (lifecycle-governed; no 'immutable forever, hot forever', SC-2)."""

    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    ARCHIVE = "archive"


class StorageKind(Enum):
    """The kind of stored thing (drives which store abstraction applies)."""

    OBJECT = "object"
    DATASET = "dataset"
    ARTIFACT = "artifact"
    METADATA = "metadata"
    SNAPSHOT = "snapshot"


@dataclass(frozen=True, slots=True)
class StorageIdentifier:
    """A stable, versioned identity for a stored item (NM-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class StorageProfile:
    """A vendor-neutral storage configuration.

    ``immutable`` marks immutable research artifacts (CP-2); ``worm`` marks write-once-read-many for
    tamper-evidence (SEC-4); ``storage_class`` drives lifecycle tiering (SC-2). No vendor fields.
    """

    storage_class: StorageClass
    immutable: bool
    worm: bool
    encrypted: bool


@dataclass(frozen=True, slots=True)
class StorageContext:
    """Immutable context for a storage operation.

    ``as_of`` is a supplied point-in-time boundary for historical reads (PIT-1); no wall-clock (CS-3).
    """

    correlation_id: CorrelationId
    as_of: str | None


class StorageProviderPort(Protocol):
    """A vendor-neutral storage provider port. Interface only — no database/object-store/client here."""

    def initialize(self) -> None: ...
    def health(self) -> str: ...
PY
streadme "$D" "core" \
"Define StorageClass (tiers), StorageKind, StorageIdentifier, StorageProfile, StorageContext, and the StorageProviderPort interface." \
"Provide the canonical, vendor-neutral storage identity/profile/context, tiering classes, and the provider port; hold no database/object-store/client logic." \
"Consumed by every other Storage Layer module; implemented by concrete backends behind the port." \
"platform_contracts.common (CorrelationId, SchemaVersion); standard library." \
"CLAUDE.md (AV2-12, CP-2, SC-2, SEC-4, PIT-1, NM-2); Architecture V2 §5.10, §6.4; RB-05 · REPRO; TDR §12/§13."

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Storage Lifecycle — the canonical lifecycle states, transitions, version, status, and service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import ContentHash, Id, SchemaVersion


class StorageLifecycle(Enum):
    """The canonical storage lifecycle."""

    REGISTERED = "registered"
    INITIALIZED = "initialized"
    AVAILABLE = "available"
    ACTIVE = "active"
    ARCHIVED = "archived"
    RETIRED = "retired"


L = StorageLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[StorageLifecycle, StorageLifecycle], ...] = (
    (L.REGISTERED, L.INITIALIZED),
    (L.INITIALIZED, L.AVAILABLE),
    (L.AVAILABLE, L.ACTIVE),
    (L.ACTIVE, L.ARCHIVED),
    (L.ARCHIVED, L.RETIRED),
    # recovery / restore from archive
    (L.ARCHIVED, L.ACTIVE),
    # graceful availability toggling
    (L.ACTIVE, L.AVAILABLE),
    (L.AVAILABLE, L.RETIRED),
)

#: Terminal state. Reproducibility-critical data is retained even when RETIRED-adjacent (RP-4, P5-01).
TERMINAL_STATES: frozenset[StorageLifecycle] = frozenset({L.RETIRED})


@dataclass(frozen=True, slots=True)
class StorageVersion:
    """An immutable, content-addressed storage version (CP-2; a change creates a new version)."""

    version: SchemaVersion
    content: ContentHash
    supersedes: str | None


@dataclass(frozen=True, slots=True)
class StorageStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: StorageLifecycle
    since: str


class StorageLifecycleService(Protocol):
    """Governs storage lifecycle transitions and supported operations. Interface only.

    Supports versioning, snapshots, archival, recovery, and migration; no infrastructure here.
    """

    def transition(self, item: Id, to: StorageLifecycle) -> None: ...
    def recover(self, item: Id) -> None: ...
    def migrate(self, item: Id, to_provider: Id) -> None: ...
PY
streadme "$D" "lifecycle" \
"Define StorageLifecycle (REGISTERED/INITIALIZED/AVAILABLE/ACTIVE/ARCHIVED/RETIRED), the canonical transitions, StorageVersion, StorageStatus, and the lifecycle service (versioning/snapshots/archival/recovery/migration)." \
"Enumerate the storage lifecycle and legal transitions as data and expose the lifecycle operations as an interface; a change creates a new immutable version; hold no infrastructure." \
"Consumed by artifact/dataset/snapshot storage, archive, retention." \
"platform_contracts.common (ContentHash, Id, SchemaVersion); standard library." \
"CLAUDE.md (CP-2, RP-4, SC-2, RL-1); Architecture V2 §5.10; RB-05 · REPRO; P5-01."

# ===========================================================================
# providers
# ===========================================================================
D="$SRC/providers"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Storage Providers — the canonical storage provider model, capabilities, and registry (no vendor)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_storage.core import StorageKind


@dataclass(frozen=True, slots=True)
class StorageCapabilities:
    """The vendor-neutral capabilities a storage backend supports (compatibility, not a vendor model)."""

    kinds: tuple[StorageKind, ...]
    supports_versioning: bool
    supports_snapshots: bool
    supports_worm: bool


@dataclass(frozen=True, slots=True)
class StorageProvider:
    """A canonical, vendor-neutral storage backend (e.g. relational/object/lakehouse), by identity."""

    provider_id: Id
    name: str
    capabilities: StorageCapabilities


class StorageProviderRegistry(Protocol):
    """Register-before-use registry of storage providers. Interface only — no persistence.

    A provider is not usable before registration; the concrete registry stores elsewhere; no vendor
    details leak through the registry.
    """

    def register(self, provider: StorageProvider) -> None: ...
    def get(self, provider: Id) -> StorageProvider: ...
PY
streadme "$D" "providers" \
"Define StorageProvider, StorageCapabilities, and StorageProviderRegistry: the canonical, vendor-neutral storage backend model and its registry." \
"Represent storage backends and their capabilities in vendor-neutral terms; register-before-use; expose no vendor implementation details; hold no logic." \
"Consumed by lifecycle migration and platform services selecting a backend." \
"platform_contracts.common (Id); core (StorageKind); standard library." \
"CLAUDE.md (AV2-12, SE-3, CP-7); Architecture V2 §5.10; RB-05 · REPRO; TDR §12/§13."

# ===========================================================================
# repository
# ===========================================================================
D="$SRC/repository"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Repository Layer — the canonical storage repository abstractions (immutable/append-only/as-of).

These mirror the domain repository patterns at the storage boundary. Immutable artifacts are
append-only (supersede, never mutate, CP-2); historical reads route through an as-of read port (PIT-1).
"""
from __future__ import annotations

from typing import Protocol, TypeVar

from platform_contracts.common import ContentHash, Id

TItem = TypeVar("TItem")


class ReadRepository(Protocol[TItem]):
    """Read side of a storage repository."""

    def get(self, id: Id) -> TItem: ...
    def exists(self, id: Id) -> bool: ...


class AppendOnlyRepository(Protocol[TItem]):
    """Repository for immutable, versioned items: add + supersede, never mutate (CP-2)."""

    def get(self, id: Id) -> TItem: ...
    def add(self, item: TItem) -> None: ...


class ContentAddressedRepository(Protocol[TItem]):
    """Retrieval of immutable items by content address (P1-02)."""

    def by_content_address(self, address: ContentHash) -> TItem: ...


class AsOfReadPort(Protocol[TItem]):
    """Point-in-time read; a historical read without an as-of is impossible by construction (PIT-1)."""

    def read_as_of(self, id: Id, as_of: str) -> TItem: ...
PY
streadme "$D" "repository" \
"Define the storage repository abstractions: ReadRepository, AppendOnlyRepository, ContentAddressedRepository, AsOfReadPort." \
"Provide canonical, generic storage repository ports at the storage boundary; immutable/append-only, content-addressed, and as-of read; hold no persistence." \
"Consumed by the storage-backed repositories; complements the domain repository patterns." \
"platform_contracts.common (ContentHash, Id); standard library." \
"CLAUDE.md (CP-2, PIT-1, P1-02); Architecture V2 §5.10, §6.4; RB-05 · REPRO; RB-08 · PIT."

# ===========================================================================
# object_storage
# ===========================================================================
D="$SRC/object_storage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Object Storage — the canonical object-store abstraction (content-addressed; WORM; no client).

Vendor-neutral object storage (S3-compatible behind an adapter, per TDR). Objects are content-addressed
and may be WORM (write-once-read-many) for tamper-evidence (SEC-4). No object-store client here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ContentHash


@dataclass(frozen=True, slots=True)
class ObjectRef:
    """An immutable, content-addressed reference to a stored object (P1-02)."""

    address: ContentHash


class ObjectStore(Protocol):
    """A vendor-neutral object store. Interface only — no object-store client/bytes here.

    ``put`` records an immutable, content-addressed object and returns its reference; existing objects
    are never mutated (CP-2). WORM objects support tamper-evident audit (SEC-4).
    """

    def put(self, address: ContentHash) -> ObjectRef: ...
    def get(self, ref: ObjectRef) -> ContentHash: ...
    def exists(self, ref: ObjectRef) -> bool: ...
PY
streadme "$D" "object_storage" \
"Define ObjectRef and the ObjectStore interface: content-addressed, vendor-neutral object storage." \
"Provide the canonical object-store interface (content-addressed, immutable, WORM-capable); hold no object-store client, bytes, or persistence." \
"Consumed by dataset/artifact/snapshot storage; realized by an S3-compatible adapter (out of scope)." \
"platform_contracts.common (ContentHash); standard library." \
"CLAUDE.md (CP-2, SEC-4, P1-02, AV2-12); Architecture V2 §5.10, §6.4; RB-05 · REPRO; TDR §13."

# ===========================================================================
# metadata_storage
# ===========================================================================
D="$SRC/metadata_storage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Metadata Storage — the canonical storage metadata model and metadata-store INTERFACE (traceable)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_storage.core import StorageIdentifier, StorageKind


@dataclass(frozen=True, slots=True)
class StorageMetadata:
    """Immutable, auditable metadata for a stored item (governance traceability, CP-6/7).

    ``lineage_ref`` and ``produced_by`` carry provenance references so a defect in a source can
    invalidate downstream (CP-6).
    """

    identifier: StorageIdentifier
    kind: StorageKind
    owner_role: str
    lineage_ref: str
    produced_by: str
    tags: tuple[str, ...]


class MetadataStore(Protocol):
    """Append-only metadata store (immutable, traceable). Interface only — no persistence."""

    def put(self, metadata: StorageMetadata) -> None: ...
    def get(self, item: Id) -> StorageMetadata: ...
PY
streadme "$D" "metadata_storage" \
"Define StorageMetadata and the MetadataStore interface: traceable, immutable storage metadata." \
"Represent storage metadata with provenance/lineage references for governance traceability; append-only; hold no persistence." \
"Consumed by every store for traceability; feeds the lineage graph / audit." \
"platform_contracts.common (Id); core (StorageIdentifier, StorageKind); standard library." \
"CLAUDE.md (CP-6/7, DP-1/2); Architecture V2 §5.10; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# artifact_storage
# ===========================================================================
D="$SRC/artifact_storage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Artifact Storage — immutable research-artifact model and store INTERFACE (reproducibility, no persistence).

Research artifacts are immutable and content-addressed (CP-2); each references its Run Manifest so it
reproduces bit-for-bit (P1-02, RP-1). Reproducibility-critical artifacts are never GC'd (RP-4).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ContentHash

from platform_storage.core import StorageIdentifier


@dataclass(frozen=True, slots=True)
class StorageArtifact:
    """An immutable, content-addressed research artifact (CP-2).

    ``manifest_ref`` references the Run Manifest that reproduces it (P1-02); a change creates a new
    version, never a mutation.
    """

    identifier: StorageIdentifier
    content: ContentHash
    manifest_ref: str
    reproducibility_critical: bool


class ArtifactStore(Protocol):
    """Append-only store for immutable research artifacts. Interface only — no persistence.

    It never mutates an artifact (supersede by version, CP-2); reproducibility-critical artifacts are
    never garbage-collected (RP-4, P5-01).
    """

    def put(self, artifact: StorageArtifact) -> None: ...
    def get(self, identifier: StorageIdentifier) -> StorageArtifact: ...
PY
streadme "$D" "artifact_storage" \
"Define StorageArtifact and the ArtifactStore interface: immutable, content-addressed, reproducible research artifacts." \
"Represent research artifacts as immutable, manifest-referenced, content-addressed items; append-only; never GC reproducibility-critical artifacts; hold no persistence." \
"Consumed by the deterministic engines (backtest/validation) and the reproducibility spine." \
"platform_contracts.common (ContentHash); core (StorageIdentifier); standard library." \
"CLAUDE.md (CP-2/4, RP-1/4, P1-02); Architecture V2 §5.10; RB-05 · REPRO; P5-01."

# ===========================================================================
# dataset_storage
# ===========================================================================
D="$SRC/dataset_storage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dataset Storage — the canonical bitemporal dataset-store INTERFACE (as-of; vintages; no DB).

Historical reads route through an as-of read (PIT-1); restatements are appended as new vintages and
never overwritten (DI-3). No database here.
"""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import ContentHash

from platform_storage.core import StorageIdentifier
from platform_storage.object_storage import ObjectRef


class DatasetStore(Protocol):
    """A vendor-neutral, bitemporal dataset store. Interface only — no database/persistence here.

    ``read_as_of`` is the only historical read path (fail-closed without an as-of, PIT-1);
    ``append_vintage`` records a restatement as a new vintage, never overwriting one (DI-3).
    """

    def read_as_of(self, dataset: StorageIdentifier, as_of: str) -> ObjectRef: ...
    def append_vintage(self, dataset: StorageIdentifier, content: ContentHash) -> None: ...
PY
streadme "$D" "dataset_storage" \
"Define the DatasetStore interface: bitemporal, as-of, vintage-aware dataset storage." \
"Provide the canonical dataset-store interface (as-of reads only, append-only vintages, never overwrite); hold no database or persistence." \
"Backs the Data Platform As-Of Gateway / vintage store; realized by ArcticDB/lakehouse (out of scope)." \
"platform_contracts.common (ContentHash); core (StorageIdentifier); object_storage (ObjectRef); standard library." \
"CLAUDE.md (PIT-1, DI-3, CP-2); Architecture V2 §5.8, §5.10, §6.4; RB-08 · PIT; RB-06/07 · DATA; P1-01."

# ===========================================================================
# snapshot_storage
# ===========================================================================
D="$SRC/snapshot_storage"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Snapshot Storage — the canonical snapshot model and snapshot-store INTERFACE (time-travel; no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ContentHash

from platform_storage.core import StorageIdentifier


@dataclass(frozen=True, slots=True)
class StorageSnapshot:
    """An immutable, content-addressed snapshot (time-travel; reproducibility support, CP-2)."""

    identifier: StorageIdentifier
    taken_at: str
    content: ContentHash


class SnapshotStore(Protocol):
    """Append-only snapshot store enabling time-travel/recovery. Interface only — no persistence."""

    def create(self, identifier: StorageIdentifier) -> StorageSnapshot: ...
    def get(self, identifier: StorageIdentifier) -> StorageSnapshot: ...
PY
streadme "$D" "snapshot_storage" \
"Define StorageSnapshot and the SnapshotStore interface: immutable, time-travel snapshots." \
"Represent snapshots as immutable, content-addressed, time-stamped items enabling time-travel/recovery; append-only; hold no persistence." \
"Supports lifecycle recovery and reproducibility; consumed by backup/archive." \
"platform_contracts.common (ContentHash); core (StorageIdentifier); standard library." \
"CLAUDE.md (CP-2, RP-1); Architecture V2 §5.10; RB-05 · REPRO."

# ===========================================================================
# backup
# ===========================================================================
D="$SRC/backup"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Backup Abstractions — the backup policy model and backup-service INTERFACE (DR/BCP; no infra).

Supports tested RPO/RTO for disaster recovery / business continuity (P6-03, RE-3). No infrastructure here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class BackupPolicy:
    """A backup policy with target RPO/RTO (tested before any live capital, P6-03)."""

    rpo_seconds: int
    rto_seconds: int
    frequency: str


class BackupService(Protocol):
    """Backup/restore abstraction for disaster recovery. Interface only — no infrastructure.

    Backups are immutable and verifiable; restore supports recovery to the target RPO/RTO.
    """

    def backup(self, item: Id) -> None: ...
    def restore(self, item: Id) -> None: ...
PY
streadme "$D" "backup" \
"Define BackupPolicy and the BackupService interface: DR/BCP backup and restore with target RPO/RTO." \
"Represent backup policy (RPO/RTO/frequency) and expose backup/restore as an interface; hold no infrastructure." \
"Supports lifecycle recovery; realized by the DR/BCP layer (tested RPO/RTO)." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (RE-3, DEP-3); Architecture V2 §5.10, §10; Disaster Recovery Governance; P6-03."

# ===========================================================================
# archive
# ===========================================================================
D="$SRC/archive"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Archive Management — the archive policy model and archive-service INTERFACE (tiering; no infra).

Archival moves items to colder tiers per policy (SC-2, P5-01) while preserving immutability and
reproducibility; reproducibility-critical items remain retrievable. No infrastructure here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_storage.core import StorageClass


@dataclass(frozen=True, slots=True)
class ArchivePolicy:
    """An archival policy: when to archive and to which (colder) tier (SC-2)."""

    archive_after_days: int
    tier: StorageClass
    immutable: bool


class ArchiveService(Protocol):
    """Archives/restores items per policy. Interface only — no infrastructure.

    Archival preserves immutability and reproducibility; it never deletes reproducibility-critical
    items (RP-4).
    """

    def archive(self, item: Id) -> None: ...
    def restore(self, item: Id) -> None: ...
PY
streadme "$D" "archive" \
"Define ArchivePolicy and the ArchiveService interface: lifecycle tiering / archival." \
"Represent archival policy (when/where to tier) and expose archive/restore as an interface; preserve immutability/reproducibility; hold no infrastructure." \
"Works with retention and lifecycle; consumes StorageClass tiers." \
"platform_contracts.common (Id); core (StorageClass); standard library." \
"CLAUDE.md (SC-2, RP-4, CP-2); Architecture V2 §5.10; RB-05 · REPRO; P5-01."

# ===========================================================================
# retention
# ===========================================================================
D="$SRC/retention"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Retention Policies — the retention model and enforcement INTERFACE (reproducibility-critical never GC'd)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class RetentionPolicy:
    """A retention policy.

    ``retain_days`` is None for indefinite retention (reproducibility-critical data, RP-4, P5-01);
    ``tier_after_days`` drives lifecycle tiering so nothing is 'immutable forever, hot forever' (SC-2).
    """

    retain_days: int | None
    reproducibility_critical: bool
    tier_after_days: int


class RetentionEnforcement(Protocol):
    """Deterministically enforces retention. Interface only.

    It MUST NOT permit deletion of reproducibility-critical data (RP-4); it drives tiering (SC-2).
    """

    def may_delete(self, item: Id) -> bool: ...
    def tier_due(self, item: Id) -> bool: ...
PY
streadme "$D" "retention" \
"Define RetentionPolicy and the RetentionEnforcement interface: retention and tiering, with reproducibility-critical data never GC'd." \
"Represent retention policy (indefinite for reproducibility-critical) and enforce it deterministically; drive tiering; never delete reproducibility-critical data; hold no logic." \
"Consumed by archive and lifecycle; enforced deterministically." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (RP-4, SC-2, CP-4, AP-8); Architecture V2 §5.10; RB-05 · REPRO; P5-01."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Storage Policies — the versioned storage policy model and governance policy INTERFACES (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id, SchemaVersion


@dataclass(frozen=True, slots=True)
class StoragePolicy:
    """A named, versioned, deterministic storage policy. Immutable; a change is a new version."""

    name: str
    version: SchemaVersion
    description: str


class ImmutabilityPolicy(Protocol):
    """Immutable artifacts are never mutated; a change creates a new version (CP-2). Interface only."""

    def is_mutation_allowed(self, item: Id) -> bool: ...


class ReproducibilityPolicy(Protocol):
    """Reproducibility-critical data is retained and reproducible from its manifest (RP-1/4). Interface only."""

    def is_reproducible(self, item: Id) -> bool: ...


class TraceabilityPolicy(Protocol):
    """Every stored item carries provenance/lineage for governance traceability (CP-6/7). Interface only."""

    def has_provenance(self, item: Id) -> bool: ...


class VendorIndependencePolicy(Protocol):
    """No core logic depends on a specific storage vendor (AV2-12). Interface only."""

    def is_vendor_neutral(self, item: Id) -> bool: ...
PY
streadme "$D" "policies" \
"Define StoragePolicy (versioned) and the governance policy interfaces: ImmutabilityPolicy, ReproducibilityPolicy, TraceabilityPolicy, VendorIndependencePolicy." \
"Express the storage governance rules (immutability, reproducibility, traceability, vendor independence) as interfaces; hold no logic." \
"Enforced by deterministic components; consumed across the Storage Layer." \
"platform_contracts.common (Id, SchemaVersion); standard library." \
"CLAUDE.md (CP-2/4/6/7, RP-1/4, AV2-12); Architecture V2 §5.10; RB-05 · REPRO."

# ===========================================================================
# validation
# ===========================================================================
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Storage Validation — integrity/reproducibility validation INTERFACES (structural; no statistics)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_storage.core import StorageIdentifier


@dataclass(frozen=True, slots=True)
class StorageIntegrityResult:
    """The immutable outcome of a storage integrity check (content-hash match)."""

    valid: bool
    detail: str


class StorageValidator(Protocol):
    """Verifies stored-item integrity and reproducibility eligibility. Interface only.

    ``verify_integrity`` checks the content-hash matches (tamper-evidence); ``verify_reproducible``
    checks the item reproduces from its manifest (RP-1). Structural only; not statistical.
    """

    def verify_integrity(self, identifier: StorageIdentifier) -> StorageIntegrityResult: ...
    def verify_reproducible(self, identifier: StorageIdentifier) -> bool: ...
PY
streadme "$D" "validation" \
"Define StorageIntegrityResult and the StorageValidator interface: content-hash integrity and reproducibility verification." \
"Verify stored-item integrity (content-hash match) and reproducibility from manifest; structural only, not statistical; hold no logic." \
"Consumed by artifact/dataset storage and the reproducibility spine." \
"core (StorageIdentifier); standard library." \
"CLAUDE.md (CP-2/4, RP-1, SEC-4, AI-2); Architecture V2 §5.10; RB-05 · REPRO."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, vendor-neutral storage error model (no vendor details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class StorageErrorKind(Enum):
    NOT_FOUND = "not_found"
    MUTATION_FORBIDDEN = "mutation_forbidden"      # immutable artifact mutation (CP-2)
    RETENTION_VIOLATION = "retention_violation"    # deleting reproducibility-critical data (RP-4)
    VINTAGE_OVERWRITE = "vintage_overwrite"        # overwriting a vintage (DI-3)
    NON_AS_OF_READ = "non_as_of_read"              # historical read without an as-of (PIT-1)
    INTEGRITY_FAILURE = "integrity_failure"        # content-hash mismatch (reproducibility/tamper)
    VENDOR_LEAK = "vendor_leak"                    # a vendor-specific detail was exposed (AV2-12)
    IRRECOVERABLE = "irrecoverable"                # backup/restore could not recover (P6-03)


@dataclass(frozen=True, slots=True)
class StorageError:
    """A canonical, vendor-neutral storage error (no vendor-specific details leaked, boundary)."""

    kind: StorageErrorKind
    message: str


class StorageFrameworkError(Exception):
    """Base exception for the Storage Layer (framework faults, not vendor errors)."""
PY
streadme "$D" "errors" \
"Define StorageError, StorageErrorKind, and StorageFrameworkError: the canonical, vendor-neutral storage error model." \
"Express storage errors in vendor-neutral terms (not-found/mutation-forbidden/retention/vintage/as-of/integrity/vendor-leak/irrecoverable); leak no vendor details; hold no logic." \
"Used across the Storage Layer modules." \
"Standard library only." \
"CLAUDE.md (CP-2, RP-4, DI-3, PIT-1, SEC-4, AV2-12); Architecture V2 §5.10, §6.4; RB-05 · REPRO; RB-06/07 · DATA."

echo "Storage Layer generated."
