"""data_connectors — the vendor-independent Data Connectors Framework.

The infrastructure abstraction layer through which all platform services obtain external data,
integrating external providers while preserving architecture boundaries and vendor independence
(AV2-12). Concrete provider adapters plug in behind these canonical interfaces.

Boundaries: it exposes only canonical interfaces and never exposes provider-specific models or leaks
vendor details. Raw responses are opaque payload references routed to the raw vault/quarantine at
ingestion (DI-2) and never exposed to research (DI-1). Secrets are references only (SEC-3). No provider
APIs, no REST/WebSocket clients, no authentication logic, no business/research/statistical logic, no
infrastructure.

Modules: core, provider, registry, factory, lifecycle, configuration, authentication, request,
response, health, retry, rate_limit, metadata, errors.
"""
from __future__ import annotations

from . import (
    authentication,
    configuration,
    core,
    errors,
    factory,
    health,
    lifecycle,
    metadata,
    provider,
    rate_limit,
    registry,
    request,
    response,
    retry,
)

__all__ = [
    "core", "provider", "registry", "factory", "lifecycle", "configuration", "authentication",
    "request", "response", "health", "retry", "rate_limit", "metadata", "errors",
]
__version__ = "0.1.0"
