#!/usr/bin/env bash
#
# generate_data_connectors.sh — Phase 3.1 Data Connectors Framework generator.
#
# Governed by: CLAUDE.md (AV2-12 vendor independence, DI-1/2 raw-data quarantine, SEC-3 secrets-by-
#              reference, CP-8, SE-2/3, CS-3); Architecture V2 §5.8 (Data Platform acquisition), §6.4/
#              §6.5; Implementation Roadmap Phase 2; RB-06/07 · DATA; Dataset Governance; TDR §3/§12.
#
# Emits the Data Connectors Framework as a new shared library, `data_connectors`: connector core +
# connector-type abstractions, provider model, provider registry, connector factory, connector
# lifecycle, configuration, authentication abstractions, request/response models, health monitoring,
# retry & rate-limit policies, connector metadata, and the error model. It depends only on the
# platform contract kernel.
#
# It is the VENDOR-INDEPENDENT ingestion abstraction: canonical interfaces ONLY. It exposes NO
# provider-specific models and leaks NO vendor details. Raw responses are OPAQUE payload references
# routed to the raw vault/quarantine at ingestion (DI-2) and NEVER exposed to research (DI-1). Secrets
# are references only (SEC-3). It contains NO provider APIs, NO REST/WebSocket clients, NO
# authentication logic, NO business/research/statistical logic, NO infrastructure. Deterministic,
# technology-independent, immutable, auditable, extensible, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/data-connectors"
SRC="$PKG/src/data_connectors"
cd "$ROOT"

# robust README helper: unset args default to empty (never aborts under set -u); a guard verifies completeness
dcreadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" deps="${5-}" rel="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# data-connectors · $name

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose
$purpose

## Responsibilities
$resp

## Dependencies
$deps

## Relationships
$rel

## Related Governance Documents
$gov
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# data-connectors — the vendor-independent Data Connectors Framework abstractions (Phase 3.1).
# Standard library + the platform contract kernel only. No provider/REST/WebSocket/auth/infra deps.
[project]
name = "data-connectors"
version = "0.1.0"
description = "Vendor-independent data-connector abstractions: provider/connector interfaces & models."
requires-python = ">=3.12"
dependencies = ["platform-contracts"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/data_connectors"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# data-connectors — implemented in Phase 3.1

This shared library contains the Data Connectors Framework (the `data_connectors` package): connector
core + connector-type abstractions, provider model, provider registry, connector factory, connector
lifecycle, configuration, authentication abstractions, request/response models, health monitoring,
retry & rate-limit policies, connector metadata, and the error model. Provider APIs, REST/WebSocket
clients, authentication logic, and infrastructure remain forbidden here. Concrete provider adapters
plug in behind these canonical interfaces; raw responses are opaque and quarantine-bound.
MD

cat > "$PKG/README.md" <<'MD'
# data-connectors (package) — `data_connectors`

> **Phase 3.1 — Data Connectors Framework (implemented).** The vendor-independent infrastructure
> abstraction layer through which all platform services obtain external data. **Abstractions only** —
> no provider APIs, no REST/WebSocket clients, no authentication logic, no infrastructure.

## Purpose
Provide the standardized, **vendor-independent** interfaces for integrating external data providers
while preserving architecture boundaries (AV2-12, SE-3, TDR §3). Concrete provider adapters plug in
**behind** these interfaces; no core logic depends on any specific vendor. It maps to the Data
Platform Layer acquisition side (Architecture V2 §5.8) and introduces no new top-level concept (RO-1).

## Authority & boundaries
It exposes **only canonical interfaces** and **never exposes provider-specific models** or leaks
vendor details. Raw responses are **opaque payload references** routed to the raw vault / quarantine
at ingestion (DI-2) and **never exposed to research** (DI-1) — research reads only certified data via
the As-Of Gateway. Secrets are **references only** (SEC-3). It contains no business, research, or
statistical logic.

## What is here (Phase 3.1)
14 modules, each a subpackage with its own `README.md`:
`core` · `provider` · `registry` · `factory` · `lifecycle` · `configuration` · `authentication` ·
`request` · `response` · `health` · `retry` · `rate_limit` · `metadata` · `errors`.

- **Canonical models:** `Connector`, `ConnectorIdentifier`, `Provider`, `ProviderCapabilities`,
  `ConnectionProfile`, `ConnectionStatus`, `AuthenticationProfile`, `DataRequest`, `DataResponse`,
  `ConnectorMetadata`, `HealthStatus`, `RateLimitPolicy`, `RetryPolicy`.
- **Supported connector types** (`core.ConnectorType` + marker protocols): Market Data · Exchange ·
  Broker · Fundamental · Alternative · News · Macro · Reference — each a vendor-neutral marker interface.
- **Lifecycle:** `REGISTERED → CONFIGURED → INITIALIZED → CONNECTED → ACTIVE → DEGRADED →
  DISCONNECTED → RETIRED`, supporting reconnect, health check, capability refresh, and graceful
  shutdown; skips forbidden (fail-closed).

## Boundary rules (verified)
- **Vendor/technology-independent:** standard library + the `platform_contracts` kernel only; a code
  scan confirms no provider/REST/WebSocket/auth/infra imports.
- **No provider models leaked:** `DataResponse` carries an opaque `ContentHash` payload reference
  (quarantine-bound), never a provider structure; `VENDOR_LEAK` / `QUARANTINE_REQUIRED` error kinds.
- **Secrets by reference:** `AuthenticationProfile` holds an `AuthSecretRef` (broker path), never a
  credential value (SEC-3, CODE-29).
- **Deterministic, immutable:** no ambient time (timestamps supplied); all models/policies are `frozen`
  dataclasses (runtime `FrozenInstanceError`); registration is register-before-use.
- **Extensible & testable:** connector-type marker protocols + factory/registry make new providers
  pluggable behind interfaces without touching consumers.
- **Compiles and imports cleanly**, 14 modules, no circular dependencies.

## Ownership
Accountable role: HD (Head of Data); security (secrets) co-owned by CISO. Architecture owner: ARB.

## Dependencies
`platform_contracts.common` only.

## Regeneration
Generated by [`tools/scaffolding/generate_data_connectors.sh`](../../tools/scaffolding/generate_data_connectors.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (AV2-12, DI-1/2, SEC-3, CODE-29, CP-8, SE-2/3, CS-3); Architecture V2 §5.8, §6.4, §6.5;
Implementation Roadmap Phase 2; RB-06/07 · DATA; Dataset Governance; Technology Decision Record §3/§12.
MD

cat > "$SRC/__init__.py" <<'PY'
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
PY

# ===========================================================================
# retry
# ===========================================================================
D="$SRC/retry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Retry Policy — retry/backoff as immutable policy data (values, not timers; no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class BackoffStrategy(Enum):
    NONE = "none"
    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    EXPONENTIAL_JITTER = "exponential_jitter"


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    """Declarative retry configuration. ``base_delay_ms`` is a value; no clock is read here (CS-3)."""

    max_attempts: int
    backoff: BackoffStrategy
    base_delay_ms: int
PY
dcreadme "$D" "retry" \
"Define RetryPolicy and BackoffStrategy: retry/backoff as immutable configuration values." \
"Express retry semantics as declarative data; the concrete adapter applies them; no timers or clock reads here." \
"Standard library only." \
"Consumed by configuration (ConnectionProfile)." \
"CLAUDE.md (RE-1, CS-3); Architecture V2 §5.8, §10; RB-06/07 · DATA."

# ===========================================================================
# rate_limit
# ===========================================================================
D="$SRC/rate_limit"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Rate Limit Policy — provider rate limiting as immutable policy data (no logic)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RateLimitPolicy:
    """Declarative rate-limit configuration for a connector (applied by the concrete adapter)."""

    max_requests: int
    per_seconds: int
    burst: int
PY
dcreadme "$D" "rate_limit" \
"Define RateLimitPolicy: provider rate limiting as immutable configuration values." \
"Express rate-limit semantics as declarative data; the concrete adapter enforces them; hold no logic." \
"Standard library only." \
"Consumed by configuration (ConnectionProfile)." \
"CLAUDE.md (RE-1, SC-3); Architecture V2 §5.8, §10; RB-06/07 · DATA."

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Connector Lifecycle — the canonical lifecycle states, transitions, status, and lifecycle service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class ConnectorLifecycle(Enum):
    """The canonical connector lifecycle."""

    REGISTERED = "registered"
    CONFIGURED = "configured"
    INITIALIZED = "initialized"
    CONNECTED = "connected"
    ACTIVE = "active"
    DEGRADED = "degraded"
    DISCONNECTED = "disconnected"
    RETIRED = "retired"


L = ConnectorLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ConnectorLifecycle, ConnectorLifecycle], ...] = (
    (L.REGISTERED, L.CONFIGURED),
    (L.CONFIGURED, L.INITIALIZED),
    (L.INITIALIZED, L.CONNECTED),
    (L.CONNECTED, L.ACTIVE),
    # health degradation / recovery
    (L.ACTIVE, L.DEGRADED),
    (L.DEGRADED, L.ACTIVE),
    (L.DEGRADED, L.DISCONNECTED),
    # disconnect / reconnect (graceful)
    (L.ACTIVE, L.DISCONNECTED),
    (L.CONNECTED, L.DISCONNECTED),
    (L.DISCONNECTED, L.CONNECTED),
    # graceful shutdown / retirement
    (L.DISCONNECTED, L.RETIRED),
    (L.CONFIGURED, L.RETIRED),
    (L.REGISTERED, L.RETIRED),
)

#: Terminal state.
TERMINAL_STATES: frozenset[ConnectorLifecycle] = frozenset({L.RETIRED})


@dataclass(frozen=True, slots=True)
class ConnectionStatus:
    """The current lifecycle status of a connector (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ConnectorLifecycle
    since: str


class ConnectorLifecycleService(Protocol):
    """Governs connector lifecycle transitions and supported operations. Interface only.

    Supports reconnect, health check, capability refresh, and graceful shutdown; no infrastructure or
    provider logic here.
    """

    def transition(self, connector: Id, to: ConnectorLifecycle) -> None: ...
    def reconnect(self, connector: Id) -> None: ...
    def refresh_capabilities(self, connector: Id) -> None: ...
    def shutdown(self, connector: Id) -> None: ...
PY
dcreadme "$D" "lifecycle" \
"Define ConnectorLifecycle (REGISTERED/CONFIGURED/INITIALIZED/CONNECTED/ACTIVE/DEGRADED/DISCONNECTED/RETIRED), the canonical transitions, ConnectionStatus, and the lifecycle service (reconnect/health-check/capability-refresh/graceful-shutdown)." \
"Enumerate the connector lifecycle and legal transitions as data and expose the lifecycle operations as an interface; hold no infrastructure or provider logic." \
"platform_contracts.common (Id); standard library." \
"Consumed by core, metadata, factory, registry." \
"CLAUDE.md (AV2-12, RE-1, CS-3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# request
# ===========================================================================
D="$SRC/request"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Request Model — the canonical, vendor-neutral data request (no provider-specific fields)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import CorrelationId


@dataclass(frozen=True, slots=True)
class TimeRange:
    """A supplied ISO-8601 time range for a historical request (no wall-clock read, CS-3)."""

    start: str
    end: str


@dataclass(frozen=True, slots=True)
class DataRequest:
    """A canonical, vendor-neutral data request.

    It contains NO provider-specific fields; the concrete adapter translates it. ``correlation_id``
    gives end-to-end traceability (CP-7).
    """

    symbols: tuple[str, ...]
    fields: tuple[str, ...]
    time_range: TimeRange | None
    correlation_id: CorrelationId
PY
dcreadme "$D" "request" \
"Define DataRequest and TimeRange: the canonical, vendor-neutral data request." \
"Represent a data request in vendor-neutral terms (symbols, fields, time range, correlation); contain no provider-specific fields; hold no logic." \
"platform_contracts.common (CorrelationId); standard library." \
"Consumed by core (Connector.fetch); the adapter translates it to a provider call (out of scope)." \
"CLAUDE.md (AV2-12, SE-2, CP-7, CS-3); Architecture V2 §5.8; RB-06/07 · DATA."

# ===========================================================================
# response
# ===========================================================================
D="$SRC/response"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Response Model — the canonical, vendor-neutral data response (opaque, quarantine-bound payload).

The raw payload is referenced by content hash and routed to the raw vault/quarantine at ingestion
(DI-2); it is NEVER a provider-specific model and is NEVER exposed to research (DI-1).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import ContentHash


class ResponseStatus(Enum):
    OK = "ok"
    PARTIAL = "partial"
    EMPTY = "empty"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class DataResponse:
    """A canonical, vendor-neutral data response.

    ``payload_ref`` is an OPAQUE content-addressed reference to the raw payload in the raw vault /
    quarantine (DI-2); the framework exposes no provider structure and never serves this to research
    (DI-1). ``retrieved_at`` is a supplied ISO-8601 time.
    """

    status: ResponseStatus
    payload_ref: ContentHash
    record_count: int
    retrieved_at: str
PY
dcreadme "$D" "response" \
"Define DataResponse and ResponseStatus: the canonical, vendor-neutral data response with an opaque, quarantine-bound payload reference." \
"Represent a response as a status + opaque content-addressed payload reference; expose no provider model; route raw data to the raw vault/quarantine, never to research; hold no logic." \
"platform_contracts.common (ContentHash); standard library." \
"Produced by core (Connector.fetch); feeds the ingestion/certification pipeline (out of scope)." \
"CLAUDE.md (DI-1/2, AV2-12, SE-2, CP-6); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# authentication
# ===========================================================================
D="$SRC/authentication"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Authentication Abstractions — vendor-neutral auth profile with secrets by reference (no auth logic).

Holds credential REFERENCES only; the credential VALUE is NEVER stored here or anywhere in the repo
(SEC-3, CODE-29, FB-14). No authentication logic — the concrete adapter/secrets broker performs auth.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AuthMethod(Enum):
    NONE = "none"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    MTLS = "mtls"
    TOKEN = "token"


@dataclass(frozen=True, slots=True)
class AuthSecretRef:
    """A reference to a credential held by the secrets broker; the value is NEVER stored (SEC-3)."""

    broker_path: str


@dataclass(frozen=True, slots=True)
class AuthenticationProfile:
    """A vendor-neutral authentication profile.

    It holds an auth method and a secret REFERENCE only; it contains no credentials and no auth logic.
    """

    method: AuthMethod
    secret_ref: AuthSecretRef | None
PY
dcreadme "$D" "authentication" \
"Define AuthenticationProfile, AuthMethod, and AuthSecretRef: vendor-neutral authentication with secrets by reference." \
"Represent authentication as a method + secret REFERENCE (never a credential value); hold no authentication logic (the broker/adapter performs auth)." \
"Standard library only." \
"Consumed by factory (connector creation); aligns with the secrets broker (OpenBao)." \
"CLAUDE.md (SEC-3, CODE-29, FB-14, AV2-12); Architecture V2 §5.8, §6.5; RB-27 · SEC; TDR §19."

# ===========================================================================
# core
# ===========================================================================
D="$SRC/core"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Connector Core — the canonical connector model, connector types, and the connector INTERFACE.

The Connector interface is vendor-neutral: connect/disconnect/fetch use canonical models only and
expose NO provider-specific models. Concrete adapters implement it behind these interfaces.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id, SchemaVersion

from data_connectors.lifecycle import ConnectionStatus
from data_connectors.request import DataRequest
from data_connectors.response import DataResponse


class ConnectorType(Enum):
    """The supported connector types (vendor-neutral)."""

    MARKET_DATA = "market_data"
    EXCHANGE = "exchange"
    BROKER = "broker"
    FUNDAMENTAL = "fundamental"
    ALTERNATIVE = "alternative"
    NEWS = "news"
    MACRO = "macro"
    REFERENCE = "reference"


@dataclass(frozen=True, slots=True)
class ConnectorIdentifier:
    """A stable, versioned identity for a connector (NM-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class Connector:
    """A registered, vendor-neutral connector (canonical model; no provider details)."""

    identifier: ConnectorIdentifier
    connector_type: ConnectorType
    provider_id: Id
    status: ConnectionStatus


class ConnectorProtocol(Protocol):
    """The canonical connector interface. Interface only — no client, no provider API here.

    ``fetch`` accepts a canonical DataRequest and returns a canonical DataResponse (opaque payload); it
    exposes no provider-specific models and leaks no vendor details.
    """

    def connect(self) -> None: ...
    def disconnect(self) -> None: ...
    def fetch(self, request: DataRequest) -> DataResponse: ...


class MarketDataConnector(ConnectorProtocol, Protocol):
    """Marker: a market-data connector."""


class ExchangeConnector(ConnectorProtocol, Protocol):
    """Marker: an exchange connector (read-only market data; NOT order routing)."""


class BrokerConnector(ConnectorProtocol, Protocol):
    """Marker: a broker connector abstraction (data/reference only at this layer; NOT execution)."""


class FundamentalDataConnector(ConnectorProtocol, Protocol):
    """Marker: a fundamental-data connector."""


class AlternativeDataConnector(ConnectorProtocol, Protocol):
    """Marker: an alternative-data connector."""


class NewsConnector(ConnectorProtocol, Protocol):
    """Marker: a news connector."""


class MacroDataConnector(ConnectorProtocol, Protocol):
    """Marker: a macro-data connector."""


class ReferenceDataConnector(ConnectorProtocol, Protocol):
    """Marker: a reference-data connector (symbology, calendars, corporate actions inputs)."""
PY
dcreadme "$D" "core" \
"Define ConnectorType (8 types), ConnectorIdentifier, Connector, the ConnectorProtocol interface, and the eight connector-type marker protocols (MarketData/Exchange/Broker/Fundamental/Alternative/News/Macro/Reference)." \
"Provide the canonical, vendor-neutral connector model and interface; connect/disconnect/fetch use canonical models only; expose no provider-specific models; hold no client/provider logic." \
"platform_contracts.common (Id, SchemaVersion); lifecycle (ConnectionStatus); request (DataRequest); response (DataResponse)." \
"Consumed by registry, factory, metadata; implemented by concrete adapters behind these interfaces." \
"CLAUDE.md (AV2-12, SE-2/3, CP-8, NM-2); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; TDR §3."

# ===========================================================================
# provider
# ===========================================================================
D="$SRC/provider"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Provider — the canonical provider model and capabilities (vendor-neutral; data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Id

from data_connectors.core import ConnectorType


@dataclass(frozen=True, slots=True)
class ProviderCapabilities:
    """The vendor-neutral capabilities a provider supports (drives compatibility, not a vendor model)."""

    connector_types: tuple[ConnectorType, ...]
    supports_streaming: bool
    supports_historical: bool


@dataclass(frozen=True, slots=True)
class Provider:
    """A canonical, vendor-neutral provider (an external data source), by identity."""

    provider_id: Id
    name: str
    capabilities: ProviderCapabilities
PY
dcreadme "$D" "provider" \
"Define Provider and ProviderCapabilities: the canonical, vendor-neutral provider model and its capabilities." \
"Represent an external provider and its supported capabilities in vendor-neutral terms; expose no vendor implementation details; hold no logic." \
"platform_contracts.common (Id); core (ConnectorType)." \
"Consumed by registry and factory." \
"CLAUDE.md (AV2-12, SE-3); Architecture V2 §5.8; RB-06/07 · DATA; TDR §3."

# ===========================================================================
# configuration
# ===========================================================================
D="$SRC/configuration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Connector Configuration — the vendor-neutral connection profile (secrets by reference; no vendor fields)."""
from __future__ import annotations

from dataclasses import dataclass

from data_connectors.rate_limit import RateLimitPolicy
from data_connectors.retry import RetryPolicy


@dataclass(frozen=True, slots=True)
class ConnectionProfile:
    """A vendor-neutral connection configuration.

    ``endpoint_ref`` is a logical endpoint reference (not a URL/host); ``parameters`` are non-secret
    label pairs; secrets are carried by reference in the AuthenticationProfile (SEC-3). No vendor fields.
    """

    endpoint_ref: str
    parameters: tuple[tuple[str, str], ...]
    retry_policy: RetryPolicy
    rate_limit_policy: RateLimitPolicy
PY
dcreadme "$D" "configuration" \
"Define ConnectionProfile: the vendor-neutral connection configuration (logical endpoint reference, non-secret parameters, retry & rate-limit policies)." \
"Represent connection configuration in vendor-neutral terms; carry no secrets and no vendor-specific fields; hold no logic." \
"retry (RetryPolicy); rate_limit (RateLimitPolicy); standard library." \
"Consumed by factory; secrets are referenced via the AuthenticationProfile." \
"CLAUDE.md (SEC-3, AV2-12, DEP-1); Architecture V2 §5.8, §6.5; RB-27 · SEC; TDR §20."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Connector Metadata — the immutable, auditable metadata of a connector (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Id

from data_connectors.core import ConnectorIdentifier, ConnectorType
from data_connectors.lifecycle import ConnectionStatus


@dataclass(frozen=True, slots=True)
class ConnectorMetadata:
    """Immutable metadata for a connector (auditable)."""

    identifier: ConnectorIdentifier
    connector_type: ConnectorType
    provider_id: Id
    owner_role: str
    status: ConnectionStatus
    tags: tuple[str, ...]
PY
dcreadme "$D" "metadata" \
"Define ConnectorMetadata: the immutable, auditable metadata of a connector." \
"Carry connector metadata (identity, type, provider, owner, status, tags) as data; hold no logic." \
"platform_contracts.common (Id); core (ConnectorIdentifier, ConnectorType); lifecycle (ConnectionStatus)." \
"Consumed by registry and health/monitoring." \
"CLAUDE.md (CP-7, OB-1); Architecture V2 §5.8; RB-06/07 · DATA."

# ===========================================================================
# health
# ===========================================================================
D="$SRC/health"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Health Monitoring — the health status model and monitor INTERFACE (narrate only; no infra)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class HealthState(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass(frozen=True, slots=True)
class HealthStatus:
    """An immutable connector health status (``checked_at`` is a supplied ISO-8601 time, CS-3)."""

    state: HealthState
    checked_at: str
    detail: str


class HealthMonitor(Protocol):
    """Surfaces connector health for monitoring. Interface only — narrates; decides no halt.

    The concrete health check plugs in behind this interface; no infrastructure here.
    """

    def check(self, connector: Id) -> HealthStatus: ...
PY
dcreadme "$D" "health" \
"Define HealthState, HealthStatus, and the HealthMonitor interface: connector health monitoring." \
"Represent connector health as immutable data and expose a monitor interface that narrates only; hold no infrastructure or decision logic." \
"platform_contracts.common (Id); standard library." \
"Feeds Production Monitoring; drives lifecycle DEGRADED transitions." \
"CLAUDE.md (OB-1/3, EXP-3, RE-2); Architecture V2 §5.8, §5.10; RB-06/07 · DATA; Production Monitoring Governance."

# ===========================================================================
# registry
# ===========================================================================
D="$SRC/registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Provider Registry — register-before-use registry of providers and connectors (no persistence)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from data_connectors.core import Connector
from data_connectors.provider import Provider


class ProviderRegistry(Protocol):
    """Append-only, register-before-use registry of providers and connectors. Interface only.

    A connector is not usable before registration; the concrete registry stores elsewhere. No provider
    details leak through the registry.
    """

    def register_provider(self, provider: Provider) -> None: ...
    def register_connector(self, connector: Connector) -> None: ...
    def get_connector(self, connector: Id) -> Connector: ...
    def get_provider(self, provider: Id) -> Provider: ...
PY
dcreadme "$D" "registry" \
"Define ProviderRegistry: the register-before-use registry of providers and connectors." \
"Express register-before-use registration and retrieval of providers/connectors as an interface; hold no persistence; leak no provider details." \
"platform_contracts.common (Id); core (Connector); provider (Provider)." \
"Consumed by factory and platform services obtaining connectors." \
"CLAUDE.md (AV2-12, CP-7, SE-3); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance."

# ===========================================================================
# factory
# ===========================================================================
D="$SRC/factory"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Connector Factory — constructs canonical Connectors behind the vendor-neutral interface (no adapters)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from data_connectors.authentication import AuthenticationProfile
from data_connectors.configuration import ConnectionProfile
from data_connectors.core import Connector


class ConnectorFactory(Protocol):
    """Constructs a canonical Connector for a provider + configuration + auth profile. Interface only.

    It returns the vendor-neutral Connector; the concrete provider adapter is out of scope and plugs
    in behind this interface (extensibility / vendor independence, AV2-12).
    """

    def create(
        self, provider: Id, profile: ConnectionProfile, auth: AuthenticationProfile
    ) -> Connector: ...
PY
dcreadme "$D" "factory" \
"Define ConnectorFactory: constructs canonical Connectors from a provider, connection profile, and auth profile." \
"Express connector construction as an interface returning a vendor-neutral Connector; the concrete adapter plugs in behind it; hold no adapter or provider logic." \
"platform_contracts.common (Id); core (Connector); configuration (ConnectionProfile); authentication (AuthenticationProfile)." \
"Consumed by platform services; makes new providers pluggable (extensibility)." \
"CLAUDE.md (AV2-12, SE-3); Architecture V2 §5.8; RB-06/07 · DATA; TDR §3."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, vendor-neutral connector error model (no provider details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ConnectorErrorKind(Enum):
    AUTH_FAILURE = "auth_failure"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    INVALID_REQUEST = "invalid_request"
    QUARANTINE_REQUIRED = "quarantine_required"  # bad data must be quarantined, never repaired (DI-2)
    VENDOR_LEAK = "vendor_leak"                   # a provider-specific model/detail was exposed (boundary)


@dataclass(frozen=True, slots=True)
class ConnectorError:
    """A canonical, vendor-neutral connector error (no provider-specific details leaked, boundary)."""

    kind: ConnectorErrorKind
    message: str


class ConnectorFrameworkError(Exception):
    """Base exception for the connectors framework (framework faults, not provider errors)."""
PY
dcreadme "$D" "errors" \
"Define ConnectorError, ConnectorErrorKind, and ConnectorFrameworkError: the canonical, vendor-neutral error model." \
"Express connector errors in vendor-neutral terms (auth/rate-limit/timeout/unavailable/invalid/quarantine/vendor-leak); leak no provider details; hold no logic." \
"Standard library only." \
"Used across the framework modules; QUARANTINE_REQUIRED feeds ingestion quarantine (DI-2)." \
"CLAUDE.md (DI-2, AV2-12, SE-2, CP-7); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; Dataset Governance."

echo "Data Connectors Framework generated."
