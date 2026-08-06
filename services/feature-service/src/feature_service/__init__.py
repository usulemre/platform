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
