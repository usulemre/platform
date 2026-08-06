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
