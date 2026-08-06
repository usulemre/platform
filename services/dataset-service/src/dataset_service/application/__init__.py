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
