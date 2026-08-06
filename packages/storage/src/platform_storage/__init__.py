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
