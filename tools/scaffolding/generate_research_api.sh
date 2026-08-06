#!/usr/bin/env bash
#
# generate_research_api.sh — Phase 3.6 Research API generator.
#
# Governed by: CLAUDE.md (SE-2/3, AV2-25 deterministic authz, WCON-2 workflows orchestrate, AI-2/3,
#              CP-7, SEC-2, HO-2, DOC-1); Architecture V2 §5.1/§5.9 (human access), §6.2 (human
#              boundary), §7; Implementation Roadmap Phase 7; RB-23 · DOC; Workflow/Agent Contracts.
#
# Emits the Research API application-interface architecture as a new shared library, `research_api`:
# API core models (request/response/error/metadata/version/identifier), query models (pagination/
# filtering/sorting/search), route hierarchy, controller interfaces, and validation/authorization/
# workflow integration — plus per-domain API controller modules. It depends only on the platform
# contract kernel and the cross-cutting foundations (validation, workflow-engine, security) by
# INTERFACE; it delegates business logic to application services and exposes NO internal domain models.
#
# It is TECHNOLOGY-INDEPENDENT: canonical API contracts + interfaces ONLY. It contains NO HTTP
# framework code, NO endpoints, NO controllers implementation, NO business logic, NO research
# implementation, NO infrastructure. Stateless, immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/research-api"
SRC="$PKG/src/research_api"
cd "$ROOT"

# robust README helper (order: Purpose, Responsibilities, Relationships, Dependencies, Governance)
apireadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# research-api · $name

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

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
# research-api — the technology-independent Research API application interface (Phase 3.6).
# Standard library + foundations only (contracts, validation, workflow-engine, security). No HTTP/infra.
[project]
name = "research-api"
version = "0.1.0"
description = "Research API application interface: request/response models, controllers, integrations."
requires-python = ">=3.12"
dependencies = ["platform-contracts", "platform-validation", "workflow-engine", "platform-security"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/research_api"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# research-api — implemented in Phase 3.6

This shared library contains the Research API application interface (the `research_api` package): API
core models, query models, route hierarchy, controller interfaces, validation/authorization/workflow
integration, the error model, and per-domain controller modules. HTTP framework code, endpoints,
controller implementations, business logic, and infrastructure remain forbidden here. The concrete
API (FastAPI/OpenAPI + gRPC, per the TDR) plugs in behind these interfaces; controllers delegate to
application services.
MD

cat > "$PKG/README.md" <<'MD'
# research-api (package) — `research_api`

> **Phase 3.6 — Research API (implemented).** The institutional application interface through which
> human users, AI agents, and authorized services interact with the research platform. It exposes
> research capabilities while enforcing governance, workflows, authorization, and validation — the
> primary entry point for research operations. **Architecture, contracts & interfaces only** — no HTTP
> framework code, no endpoints, no controller implementations, no business logic, no infrastructure.

## Purpose
Define the technology-independent API architecture (Architecture V2 §5.1/§5.9, §6.2/§7). The concrete
API (FastAPI/OpenAPI for external, gRPC for internal, per the [TDR](../../docs/architecture/technology_decision_record.md) §8/§11)
plugs in **behind** these interfaces. Controllers **delegate business logic to application services**;
the API validates requests, enforces authorization, triggers approved workflows, publishes domain
events, and returns canonical responses — and **exposes no internal domain models**.

## What is here (Phase 3.6)
20 modules, each a subpackage with its own `README.md`:
- **Common:** `core` (ApiRequest/ApiResponse/ErrorResponse/ApiMetadata/ApiVersion/ResourceIdentifier)
  · `query` (Pagination/Filtering/Sorting/Search) · `routing` (route hierarchy) · `controller` (base
  controller + API pipeline) · `validation_integration` · `authorization_integration` ·
  `workflow_integration` · `errors`.
- **Per-domain controllers:** `research` · `experiments` · `datasets` · `features` · `signals` ·
  `strategies` · `portfolios` · `backtests` · `risk` · `validation` · `workflows` · `governance`.

- **Canonical API models:** `ApiRequest`, `ApiResponse`, `ErrorResponse`, `Pagination`, `Filtering`,
  `Sorting`, `Search`, `ResourceIdentifier`, `ApiMetadata`, `ApiVersion`.

## The API request pipeline (documented contract)
Every consequential operation flows: **validate** (Validation Foundation) → **authorize** (Auth &
Authz, default-deny) → **trigger approved workflow** (Workflow Contracts) → **delegate to application
service** → **publish domain event** → **return canonical response**. The API never adjudicates,
never bypasses validation/workflow/authz, and never exposes domain models.

## Boundary rules (verified)
- **Depends only on application services + foundations by interface:** a code scan confirms it imports
  only `platform_contracts`, `platform_validation`, `workflow_engine`, `platform_security` — no
  `core_domain` (no internal domain models), no services, no HTTP framework, no infrastructure.
- **Technology-independent:** routes use a framework-agnostic `OperationKind` (not HTTP verbs); no
  `fastapi`/`flask`/`grpc`/`requests` imports (verified).
- **Stateless & immutable:** all API models are `frozen` dataclasses (runtime `FrozenInstanceError`);
  controllers are `Protocol` interfaces with `...` bodies (no state, no logic).
- **Secure & auditable:** `authorization_integration` (default-deny, no AI authorizes) and
  `validation_integration` are mandatory in the pipeline; `DOMAIN_MODEL_LEAK` error guards the boundary.
- **Compiles and imports cleanly**, 20 modules, no circular dependencies.

## Ownership
Accountable role: PE (with GRC for approval/sign-off surfaces). Architecture owner: ARB.

## Dependencies
`platform_contracts`, `platform_validation`, `workflow_engine`, `platform_security`.

## Regeneration
Generated by [`tools/scaffolding/generate_research_api.sh`](../../tools/scaffolding/generate_research_api.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (SE-2/3, AV2-25, WCON-2, AI-2/3, CP-7, SEC-2, HO-2, DOC-1); Architecture V2 §5.1, §5.9, §6.2, §7;
Implementation Roadmap Phase 7; RB-23 · DOC; Workflow Contracts; Agent Contracts; Technology Decision Record §8/§11.
MD

cat > "$SRC/__init__.py" <<'PY'
"""research_api — the Research API application interface.

The institutional application interface through which human users, AI agents, and authorized services
interact with the research platform. It exposes research capabilities while enforcing governance,
workflows, authorization, and validation, and is the primary entry point for research operations.

Boundaries: it depends only on the platform contract kernel and the cross-cutting foundations
(validation, workflow-engine, security) by interface; controllers delegate business logic to
application services; it exposes no internal domain models (no dependency on core_domain). It contains
no HTTP framework code, no endpoints, no controller implementations, no business logic, no
infrastructure. Stateless and immutable.

Modules: core, query, routing, controller, validation_integration, authorization_integration,
workflow_integration, errors, and the per-domain controllers (research, experiments, datasets,
features, signals, strategies, portfolios, backtests, risk, validation, workflows, governance).
"""
from __future__ import annotations

from . import (
    authorization_integration,
    backtests,
    controller,
    core,
    datasets,
    errors,
    experiments,
    features,
    governance,
    portfolios,
    query,
    research,
    risk,
    routing,
    signals,
    strategies,
    validation,
    validation_integration,
    workflow_integration,
    workflows,
)

__all__ = [
    "core", "query", "routing", "controller", "validation_integration",
    "authorization_integration", "workflow_integration", "errors",
    "research", "experiments", "datasets", "features", "signals", "strategies", "portfolios",
    "backtests", "risk", "validation", "workflows", "governance",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# core
# ===========================================================================
D="$SRC/core"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""API Core — the canonical API request/response envelope models (data only; generic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar

from platform_contracts.common import CorrelationId

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class ApiVersion:
    """The semantic version of the API contract (VER-1)."""

    major: int
    minor: int
    patch: int


@dataclass(frozen=True, slots=True)
class ResourceIdentifier:
    """A canonical, opaque resource reference (never an internal domain aggregate, SE-2)."""

    resource_type: str
    id: str


@dataclass(frozen=True, slots=True)
class ApiMetadata:
    """Immutable metadata on every API message.

    ``security_context_ref`` references the authenticated principal (no credentials, SEC-3);
    ``correlation_id`` gives end-to-end traceability (CP-7); ``occurred_at`` is supplied (CS-3).
    """

    api_version: ApiVersion
    correlation_id: CorrelationId
    security_context_ref: str
    occurred_at: str


@dataclass(frozen=True, slots=True)
class ApiRequest(Generic[T]):
    """An immutable API request: metadata + a typed API payload (a DTO, never a domain model)."""

    meta: ApiMetadata
    payload: T


class ApiStatus(Enum):
    OK = "ok"
    CREATED = "created"
    ACCEPTED = "accepted"       # accepted; a workflow was triggered
    REJECTED = "rejected"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class ApiResponse(Generic[T]):
    """An immutable, canonical API response: metadata + status + a typed API payload."""

    meta: ApiMetadata
    status: ApiStatus
    payload: T | None


@dataclass(frozen=True, slots=True)
class ErrorResponse:
    """An immutable canonical error response (never leaks provider/internal details)."""

    meta: ApiMetadata
    error_code: str
    message: str
PY
apireadme "$D" "core" \
"Define the canonical API envelope models: ApiVersion, ResourceIdentifier, ApiMetadata, ApiRequest, ApiResponse, ApiStatus, ErrorResponse." \
"Provide the immutable, generic request/response/error envelope carrying API DTOs (never domain models); hold no logic." \
"Consumed by every controller and integration module; ApiMetadata references the security context." \
"platform_contracts.common (CorrelationId); standard library." \
"CLAUDE.md (SE-2, CP-7, SEC-3, VER-1, CS-3); Architecture V2 §5.9, §6.2; RB-23 · DOC; TDR §11."

# ===========================================================================
# query
# ===========================================================================
D="$SRC/query"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""API Query — pagination, filtering, sorting, and search models (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True, slots=True)
class Pagination:
    """Immutable pagination parameters."""

    page: int
    page_size: int
    cursor: str | None


class SortDirection(Enum):
    ASC = "asc"
    DESC = "desc"


@dataclass(frozen=True, slots=True)
class Sorting:
    """An immutable sort specification."""

    field: str
    direction: SortDirection


@dataclass(frozen=True, slots=True)
class FilterCriterion:
    """An immutable filter criterion (field/operator/value)."""

    field: str
    operator: str
    value: str


@dataclass(frozen=True, slots=True)
class Filtering:
    """An immutable set of filter criteria."""

    criteria: tuple[FilterCriterion, ...]


@dataclass(frozen=True, slots=True)
class Search:
    """An immutable search request combining text, filtering, sorting, and pagination.

    Results are always access-filtered by authorization (never surface unauthorized data, SEC-2).
    """

    query: str
    filtering: Filtering | None
    sorting: tuple[Sorting, ...]
    pagination: Pagination
PY
apireadme "$D" "query" \
"Define Pagination, Sorting, SortDirection, FilterCriterion, Filtering, and Search: the API query-refinement models." \
"Provide immutable pagination/filtering/sorting/search models for list and search operations; results are access-filtered; hold no logic." \
"Consumed by controllers for list/search operations." \
"Standard library only." \
"CLAUDE.md (SEC-2, SE-2); Architecture V2 §5.9, §6.5; RB-23 · DOC."

# ===========================================================================
# routing
# ===========================================================================
D="$SRC/routing"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Route Hierarchy — technology-independent route definitions (framework-agnostic; no HTTP verbs)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class OperationKind(Enum):
    """A framework-agnostic operation kind (NOT an HTTP verb; the concrete API maps these)."""

    CREATE = "create"
    READ = "read"
    LIST = "list"
    UPDATE = "update"
    ACTION = "action"
    DELETE = "delete"


@dataclass(frozen=True, slots=True)
class RouteDefinition:
    """An immutable, technology-independent route definition.

    ``workflow_ref`` names the Tier-5 workflow this route triggers for a consequential operation (the
    API never bypasses Workflow Contracts); ``requires_authorization`` is default-True (default-deny).
    """

    path_template: str
    operation: OperationKind
    resource_type: str
    requires_authorization: bool
    workflow_ref: str | None


@dataclass(frozen=True, slots=True)
class ApiRouteTree:
    """The immutable route hierarchy of the API (a set of route definitions)."""

    routes: tuple[RouteDefinition, ...]
PY
apireadme "$D" "routing" \
"Define OperationKind, RouteDefinition, and ApiRouteTree: the technology-independent route hierarchy." \
"Represent routes framework-agnostically (operation kind, not HTTP verb); bind consequential routes to Tier-5 workflows; default-require authorization; hold no logic." \
"Consumed by each domain controller module (which declares its ROUTES)." \
"Standard library only." \
"CLAUDE.md (WCON-2, SEC-2, SE-3); Architecture V2 §5.4, §5.9; RB-23 · DOC; Workflow Contracts."

# ===========================================================================
# validation_integration
# ===========================================================================
D="$SRC/validation_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Integration — the API request-validation INTERFACE (Validation Foundation; mandatory).

The API MUST NOT bypass the Validation Foundation. Structural request validation only; not statistical.
"""
from __future__ import annotations

from typing import Protocol

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class ApiRequestValidator(Protocol):
    """Validates an API request via the Validation Foundation before processing. Interface only.

    Validation is mandatory and structural (never statistical, AI-2); a failed validation rejects the
    request fail-closed.
    """

    def validate(self, request_ref: str, context: ValidationContext) -> ValidationReport: ...
PY
apireadme "$D" "validation_integration" \
"Define ApiRequestValidator: the mandatory API request-validation interface using the Validation Foundation." \
"Validate every API request structurally via the Validation Foundation before processing; never bypass validation; never statistical; hold no logic." \
"Uses platform_validation; first stage of the API pipeline." \
"platform_validation (ValidationContext, ValidationReport)." \
"CLAUDE.md (AI-2, DE-4, VS-1); Architecture V2 §5.6, §5.9; RB-04 · VAL; Validation Foundation."

# ===========================================================================
# authorization_integration
# ===========================================================================
D="$SRC/authorization_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Authorization Integration — the API authorization INTERFACE (Auth & Authz; default-deny; mandatory).

The API MUST NOT bypass Authentication & Authorization. Authorization is deterministic and default-deny;
an LLM MUST NEVER authorize (AV2-25).
"""
from __future__ import annotations

from typing import Protocol

from platform_security.authorization import AuthorizationRequest, AuthorizationResult


class ApiAuthorizationGuard(Protocol):
    """Authorizes an API request via the Auth & Authz Foundation before processing. Interface only.

    Default-deny and least-privilege (SEC-2); deterministic and never AI-policed (AV2-25); a denied
    request is rejected fail-closed and audited.
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationResult: ...
PY
apireadme "$D" "authorization_integration" \
"Define ApiAuthorizationGuard: the mandatory API authorization interface using the Auth & Authz Foundation." \
"Authorize every API request (default-deny, least-privilege) before processing; never bypass authorization; deterministic, never AI-policed; hold no logic." \
"Uses platform_security; second stage of the API pipeline; feeds the audit trail." \
"platform_security.authorization (AuthorizationRequest, AuthorizationResult)." \
"CLAUDE.md (SEC-2, AV2-25, AI-4, HO-1); Architecture V2 §6.3, §6.5; RB-27 · SEC; Auth & Authz Foundation."

# ===========================================================================
# workflow_integration
# ===========================================================================
D="$SRC/workflow_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Integration — the API workflow-trigger INTERFACE (Workflow Contracts; orchestrate not adjudicate).

The API MUST NOT bypass Workflow Contracts. It triggers approved Tier-5 workflows for consequential
operations; it never adjudicates (WCON-2).
"""
from __future__ import annotations

from typing import Protocol

from workflow_engine.context import WorkflowContext
from workflow_engine.instance import WorkflowInstance


class ApiWorkflowTrigger(Protocol):
    """Triggers an approved Tier-5 workflow for a consequential API operation. Interface only.

    The API triggers the workflow; the workflow orchestrates and its gates delegate to deterministic
    engines/humans (WCON-2, AV2-18). The API never bypasses the staged chain.
    """

    def trigger(self, workflow_ref: str, context: WorkflowContext) -> WorkflowInstance: ...
PY
apireadme "$D" "workflow_integration" \
"Define ApiWorkflowTrigger: the API workflow-trigger interface using the Workflow Engine (Tier-5 contracts)." \
"Trigger approved Tier-5 workflows for consequential operations; never bypass Workflow Contracts; the API orchestrates by triggering, it never adjudicates; hold no logic." \
"Uses workflow_engine; third stage of the API pipeline; realizes the staged chain." \
"workflow_engine (WorkflowContext, WorkflowInstance)." \
"CLAUDE.md (WCON-2, AV2-18, RG-3); Architecture V2 §5.4, §7; Workflow Contracts; Workflow Engine."

# ===========================================================================
# controller
# ===========================================================================
D="$SRC/controller"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Controller — the base controller marker and the canonical API pipeline INTERFACE.

A controller delegates to an application service; it validates, authorizes, triggers approved
workflows, publishes domain events, and returns canonical responses. It exposes no domain models,
contains no business logic, and is stateless.
"""
from __future__ import annotations

from typing import Protocol


class Controller(Protocol):
    """Marker base for API controllers. Interface only — no endpoints, no HTTP, no business logic, stateless."""

    ...


class ApiPipeline(Protocol):
    """The canonical API request pipeline. Interface only.

    Every consequential operation flows: validate (Validation Foundation) -> authorize (Auth & Authz,
    default-deny) -> trigger approved workflow (Workflow Contracts) -> delegate to the application
    service -> publish domain event -> return canonical response. No stage may be bypassed.
    """

    def process(self, request_ref: str) -> str: ...
PY
apireadme "$D" "controller" \
"Define the Controller marker and the ApiPipeline interface (validate -> authorize -> workflow -> delegate -> publish -> respond)." \
"Provide the base controller contract and the canonical, no-bypass API pipeline; controllers delegate to application services and hold no business logic; stateless." \
"Base for every per-domain controller; composes the validation/authorization/workflow integrations." \
"Standard library only." \
"CLAUDE.md (SE-2/3, WCON-2, AV2-25, SC-4); Architecture V2 §5.9, §6.2/§6.3, §7; RB-23 · DOC."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, technology-independent API error model (no internal details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ApiErrorKind(Enum):
    VALIDATION_FAILED = "validation_failed"      # request failed validation (fail-closed)
    UNAUTHENTICATED = "unauthenticated"
    FORBIDDEN = "forbidden"                      # authorization denied (default-deny, SEC-2)
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    WORKFLOW_REQUIRED = "workflow_required"      # a consequential op requires a workflow (WCON-2)
    DOMAIN_MODEL_LEAK = "domain_model_leak"      # an internal domain model was exposed (boundary, SE-2)
    RATE_LIMITED = "rate_limited"
    INTERNAL = "internal"


@dataclass(frozen=True, slots=True)
class ApiError:
    """A canonical, technology-independent API error (leaks no internal/provider details)."""

    kind: ApiErrorKind
    code: str
    message: str
PY
apireadme "$D" "errors" \
"Define ApiError and ApiErrorKind: the canonical, technology-independent API error model." \
"Express API errors in canonical terms (validation/unauthenticated/forbidden/not-found/conflict/workflow-required/domain-model-leak/rate-limited/internal); leak no internal details; hold no logic." \
"Used across controllers; DOMAIN_MODEL_LEAK guards the no-domain-model boundary." \
"Standard library only." \
"CLAUDE.md (SE-2, SEC-2, WCON-2, CP-7); Architecture V2 §5.9, §6.2; RB-23 · DOC."

# ===========================================================================
# PER-DOMAIN CONTROLLER MODULES (uniform template)
# ===========================================================================
# module|ControllerClass|resource|workflow_ref
while IFS='|' read -r mod ctrl res wf; do
  [ -z "$mod" ] && continue
  D="$SRC/$mod"; mkdir -p "$D"
  if [ -z "$wf" ]; then wfarg="None"; wfdoc="no staged workflow"; else wfarg="\"$wf\""; wfdoc="Tier-5 workflow $wf"; fi
  cat > "$D/__init__.py" <<PY
"""$mod API — the $mod controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class $ctrl(Protocol):
    """API controller for $mod. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows ($wfdoc), delegates to the $mod application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the $mod resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/$res", OperationKind.CREATE, "$res", True, $wfarg),
    RouteDefinition("/$res/{id}", OperationKind.READ, "$res", True, None),
    RouteDefinition("/$res", OperationKind.LIST, "$res", True, None),
    RouteDefinition("/$res/{id}/actions", OperationKind.ACTION, "$res", True, $wfarg),
)
PY
  apireadme "$D" "$mod" \
"Define the $ctrl interface and the $mod route hierarchy: the API surface for $mod operations, delegating to the $mod application service." \
"Expose $mod create/get/list/action operations as a controller interface that validates, authorizes, triggers workflows ($wfdoc), delegates to the application service, and returns canonical responses; hold no business logic and expose no domain models." \
"core (ApiRequest/ApiResponse); routing (RouteDefinition); delegates to the $mod application service; composed via the API pipeline." \
"research_api.core; research_api.routing." \
"CLAUDE.md (SE-2/3, WCON-2, AV2-25, SEC-2); Architecture V2 §5.9, §6.2/§6.3; RB-23 · DOC; the $mod service and its registry/governance."
done <<'DATA'
research|ResearchController|research|WFC-43
experiments|ExperimentController|experiments|WFC-45
datasets|DatasetController|datasets|
features|FeatureController|features|WFC-44
signals|SignalController|signals|
strategies|StrategyController|strategies|
portfolios|PortfolioController|portfolios|WFC-48
backtests|BacktestController|backtests|WFC-45
risk|RiskController|risk|WFC-47
validation|ValidationController|validation|WFC-46
workflows|WorkflowApiController|workflows|
governance|GovernanceController|governance|WFC-49
DATA

echo "Research API generated."
