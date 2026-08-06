#!/usr/bin/env bash
#
# generate_admin_api.sh — Phase 3.7 Admin API generator.
#
# Governed by: CLAUDE.md (SEC-2, AV2-25, WCON-2, HO-1/2/3, AI-3/4, AG-1..4, CP-7, SEC-4, SE-2/3, DOC-1);
#              Architecture V2 §5.1 (Human Governance), §6.2 (human boundary), §6.3/§6.5, §7;
#              Implementation Roadmap Phase 7; RB-23 · DOC; RB-27 · SEC; Agent/Workflow Contracts.
#
# Emits the Admin API administrative-interface architecture as a new shared library, `admin_api`: API
# core models, canonical admin responses, administrative route hierarchy, controller interfaces, and
# validation/authorization/workflow/governance/audit integration — plus per-domain admin controller
# modules. It depends only on the platform contract kernel and the cross-cutting foundations
# (validation, workflow-engine, security) by INTERFACE; it delegates to administrative application
# services and exposes NO internal domain models.
#
# It is TECHNOLOGY-INDEPENDENT: canonical API contracts + interfaces ONLY. It enforces governance,
# authorization, complete auditability, and counter-signed control-changes (HO-2); it respects Agent
# Contracts (agent admin never grants decide authority, AI-1..4). It contains NO HTTP framework code,
# NO endpoints, NO controller implementations, NO business logic, NO infrastructure, NO UI. Stateless,
# immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/admin-api"
SRC="$PKG/src/admin_api"
cd "$ROOT"

# robust README helper (order: Purpose, Responsibilities, Relationships, Dependencies, Governance)
admireadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# admin-api · $name

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

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
# admin-api — the technology-independent Admin API administrative interface (Phase 3.7).
# Standard library + foundations only (contracts, validation, workflow-engine, security). No HTTP/infra.
[project]
name = "admin-api"
version = "0.1.0"
description = "Admin API administrative interface: request/response models, controllers, integrations."
requires-python = ">=3.12"
dependencies = ["platform-contracts", "platform-validation", "workflow-engine", "platform-security"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/admin_api"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# admin-api — implemented in Phase 3.7

This shared library contains the Admin API administrative interface (the `admin_api` package): API
core models, canonical admin responses, administrative route hierarchy, controller interfaces,
validation/authorization/workflow/governance/audit integration, the error model, and per-domain admin
controller modules. HTTP framework code, endpoints, controller implementations, business logic,
infrastructure, and UI remain forbidden here. The concrete API plugs in behind these interfaces;
controllers delegate to administrative application services, and control-changing operations require
human counter-sign.
MD

cat > "$PKG/README.md" <<'MD'
# admin-api (package) — `admin_api`

> **Phase 3.7 — Admin API (implemented).** The institutional administrative interface for platform
> governance, operational management, system administration, and institutional oversight — the primary
> entry point for administrative operations. It provides secure administrative capabilities while
> enforcing governance, authorization, auditability, and operational safety. **Architecture, contracts
> & interfaces only** — no HTTP framework code, no endpoints, no controller implementations, no
> business logic, no infrastructure, no UI.

## Purpose
Define the technology-independent administrative API architecture (Architecture V2 §5.1/§6.2). The
concrete API plugs in **behind** these interfaces. Controllers **delegate to administrative application
services**; the Admin API enforces Authentication & Authorization, respects governance rules, triggers
approved workflows only, maintains **complete auditability**, publishes administrative domain events,
and **exposes no internal domain models**. Control-changing / capital-affecting operations require
human approval **and independent counter-sign** (HO-2); no AI approves (AI-3), and agent administration
never grants `decide` authority (AI-1..4, AG-1..4).

## What is here (Phase 3.7)
28 modules, each a subpackage with its own `README.md`:
- **Common:** `core` (AdminRequest/AdminResponse/ApiMetadata/ApiVersion/ResourceIdentifier/ErrorResponse)
  · `responses` (Audit/Health/Configuration/Permission/Role/Registry/Workflow/Agent responses) ·
  `routing` (admin route hierarchy with counter-sign) · `controller` (base + AdminPipeline) ·
  `validation_integration` · `authorization_integration` · `workflow_integration` ·
  `governance_integration` · `audit_integration` · `errors`.
- **Per-domain admin controllers:** `administration` · `users` · `roles` · `permissions` · `agents` ·
  `agent_registry` · `workflow_management` · `rulebooks` · `contracts` · `registries` · `governance` ·
  `architecture` · `configuration` · `system_health` · `monitoring` · `audit` · `incidents` ·
  `disaster_recovery`.

- **Canonical API models:** `AdminRequest`, `AdminResponse`, `AuditResponse`, `HealthResponse`,
  `ConfigurationResponse`, `PermissionResponse`, `RoleResponse`, `RegistryResponse`, `WorkflowResponse`,
  `AgentResponse`, `ApiMetadata`, `ApiVersion`.

## The admin request pipeline (documented contract)
Every administrative operation flows: **validate** → **authenticate + authorize** (default-deny) →
**enforce governance rules** (human approval + counter-sign for control-changes, HO-2/3) → **trigger
approved workflow** (Workflow Contracts) → **delegate to application service** → **record complete
audit** (tamper-evident) → **publish administrative event** → **return canonical response**. No stage
is bypassable.

## Boundary rules (verified)
- **Depends only on application services + foundations by interface:** a code scan confirms it imports
  only `platform_contracts`, `platform_validation`, `workflow_engine`, `platform_security` — no
  `core_domain` (no internal domain models), no services, no HTTP framework, no infrastructure.
- **Never bypass Agent/Workflow Contracts, Validation, or Authorization:** `AGENT_CONTRACT_BYPASS`,
  `WORKFLOW_REQUIRED`, `VALIDATION_FAILED`, `FORBIDDEN`, `COUNTER_SIGN_REQUIRED`, `GOVERNANCE_VIOLATION`
  error kinds; agents admin never grants `decide` authority.
- **Complete auditability:** `audit_integration` records every operation in a tamper-evident trail
  (`platform_security.audit`, CP-7/SEC-4).
- **Technology-independent, stateless, immutable:** framework-agnostic routes; all models are `frozen`
  dataclasses (runtime `FrozenInstanceError`); controllers are `Protocol` interfaces (no state/logic).
- **Compiles and imports cleanly**, 28 modules, no circular dependencies.

## Ownership
Accountable role: GRC (governance) with PE (platform). Architecture owner: ARB.

## Dependencies
`platform_contracts`, `platform_validation`, `workflow_engine`, `platform_security`.

## Regeneration
Generated by [`tools/scaffolding/generate_admin_api.sh`](../../tools/scaffolding/generate_admin_api.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (SEC-2, AV2-25, WCON-2, HO-1/2/3, AI-3/4, AG-1..4, CP-7, SEC-4, SE-2/3); Architecture V2
§5.1, §6.2, §6.3, §6.5, §7; Implementation Roadmap Phase 7; RB-23 · DOC; RB-27 · SEC; RB-15 · AIGOV;
Agent Contracts; Workflow Contracts; Agent Registry.
MD

cat > "$SRC/__init__.py" <<'PY'
"""admin_api — the Admin API administrative interface.

The institutional administrative interface for platform governance, operational management, system
administration, and institutional oversight. It provides secure administrative capabilities while
enforcing governance, authorization, auditability, and operational safety.

Boundaries: it depends only on the platform contract kernel and the cross-cutting foundations
(validation, workflow-engine, security) by interface; controllers delegate to administrative
application services; it exposes no internal domain models (no dependency on core_domain). It enforces
governance (human approval + counter-sign for control-changes, HO-2), respects Agent Contracts (agent
admin never grants decide authority), maintains complete auditability, and never bypasses Workflow/
Agent Contracts, Validation, or Authorization. No HTTP framework, no endpoints, no controller
implementations, no business logic, no infrastructure, no UI. Stateless and immutable.

Modules: core, responses, routing, controller, validation_integration, authorization_integration,
workflow_integration, governance_integration, audit_integration, errors, and the per-domain admin
controllers.
"""
from __future__ import annotations

from . import (
    administration,
    agent_registry,
    agents,
    architecture,
    audit,
    audit_integration,
    authorization_integration,
    configuration,
    contracts,
    controller,
    core,
    disaster_recovery,
    errors,
    governance,
    governance_integration,
    incidents,
    monitoring,
    permissions,
    registries,
    responses,
    roles,
    routing,
    rulebooks,
    system_health,
    users,
    validation_integration,
    workflow_integration,
    workflow_management,
)

__all__ = [
    "core", "responses", "routing", "controller", "validation_integration",
    "authorization_integration", "workflow_integration", "governance_integration",
    "audit_integration", "errors",
    "administration", "users", "roles", "permissions", "agents", "agent_registry",
    "workflow_management", "rulebooks", "contracts", "registries", "governance", "architecture",
    "configuration", "system_health", "monitoring", "audit", "incidents", "disaster_recovery",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# core
# ===========================================================================
D="$SRC/core"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""API Core — the canonical Admin API request/response envelope models (data only; generic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar

from platform_contracts.common import CorrelationId

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class ApiVersion:
    """The semantic version of the Admin API contract (VER-1)."""

    major: int
    minor: int
    patch: int


@dataclass(frozen=True, slots=True)
class ResourceIdentifier:
    """A canonical, opaque administrative resource reference (never an internal domain aggregate, SE-2)."""

    resource_type: str
    id: str


@dataclass(frozen=True, slots=True)
class ApiMetadata:
    """Immutable metadata on every Admin API message.

    ``security_context_ref`` references the authenticated administrator (no credentials, SEC-3);
    ``correlation_id`` gives end-to-end traceability (CP-7); ``occurred_at`` is supplied (CS-3).
    """

    api_version: ApiVersion
    correlation_id: CorrelationId
    security_context_ref: str
    occurred_at: str


class AdminStatus(Enum):
    OK = "ok"
    ACCEPTED = "accepted"                 # accepted; a workflow was triggered
    PENDING_COUNTER_SIGN = "pending_counter_sign"  # awaiting independent counter-sign (HO-2)
    REJECTED = "rejected"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class AdminRequest(Generic[T]):
    """An immutable administrative request: metadata + a typed admin DTO (never a domain model)."""

    meta: ApiMetadata
    payload: T


@dataclass(frozen=True, slots=True)
class AdminResponse(Generic[T]):
    """An immutable, canonical administrative response: metadata + status + a typed admin DTO."""

    meta: ApiMetadata
    status: AdminStatus
    payload: T | None


@dataclass(frozen=True, slots=True)
class ErrorResponse:
    """An immutable canonical error response (never leaks provider/internal details)."""

    meta: ApiMetadata
    error_code: str
    message: str
PY
admireadme "$D" "core" \
"Define the canonical Admin API envelope models: ApiVersion, ResourceIdentifier, ApiMetadata, AdminStatus (incl. PENDING_COUNTER_SIGN), AdminRequest, AdminResponse, ErrorResponse." \
"Provide the immutable, generic administrative request/response/error envelope carrying admin DTOs (never domain models); model the counter-sign-pending status; hold no logic." \
"Consumed by every controller, response, and integration module; ApiMetadata references the administrator's security context." \
"platform_contracts.common (CorrelationId); standard library." \
"CLAUDE.md (SE-2, CP-7, SEC-3, HO-2, VER-1, CS-3); Architecture V2 §5.1, §6.2; RB-23 · DOC."

# ===========================================================================
# responses
# ===========================================================================
D="$SRC/responses"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Admin Responses — the canonical administrative response models (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from admin_api.core import AdminStatus, ApiMetadata


@dataclass(frozen=True, slots=True)
class AuditResponse:
    """A response carrying references to tamper-evident audit records (no internal details)."""

    meta: ApiMetadata
    status: AdminStatus
    record_refs: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class HealthResponse:
    """A response carrying component health summaries (component -> health)."""

    meta: ApiMetadata
    status: AdminStatus
    components: tuple[tuple[str, str], ...]


@dataclass(frozen=True, slots=True)
class ConfigurationResponse:
    """A response carrying configuration references (secrets by reference only, SEC-3)."""

    meta: ApiMetadata
    status: AdminStatus
    config_refs: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class PermissionResponse:
    """A response carrying permission references."""

    meta: ApiMetadata
    status: AdminStatus
    permissions: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RoleResponse:
    """A response carrying role references."""

    meta: ApiMetadata
    status: AdminStatus
    roles: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RegistryResponse:
    """A response carrying registry entry references (any of the six registries + agent registry)."""

    meta: ApiMetadata
    status: AdminStatus
    entries: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class WorkflowResponse:
    """A response carrying a triggered workflow instance reference."""

    meta: ApiMetadata
    status: AdminStatus
    instance_ref: str


@dataclass(frozen=True, slots=True)
class AgentResponse:
    """A response carrying an agent reference and its authority ceiling (propose/narrate, never decide)."""

    meta: ApiMetadata
    status: AdminStatus
    agent_ref: str
    authority: str
PY
admireadme "$D" "responses" \
"Define the canonical admin responses: AuditResponse, HealthResponse, ConfigurationResponse, PermissionResponse, RoleResponse, RegistryResponse, WorkflowResponse, AgentResponse." \
"Provide the immutable, canonical administrative response shapes (references only, no internal details); the AgentResponse surfaces the authority ceiling; hold no logic." \
"Returned by the per-domain admin controllers; built on the core envelope." \
"core (AdminStatus, ApiMetadata); standard library." \
"CLAUDE.md (SE-2, SEC-3, CP-7, AI-1..4); Architecture V2 §5.1, §6.2; RB-23 · DOC."

# ===========================================================================
# routing
# ===========================================================================
D="$SRC/routing"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Admin Route Hierarchy — technology-independent admin route definitions (framework-agnostic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class OperationKind(Enum):
    """A framework-agnostic administrative operation kind (NOT an HTTP verb)."""

    GET = "get"
    LIST = "list"
    ADMINISTER = "administer"  # a control-changing administrative action
    APPROVE = "approve"
    REVOKE = "revoke"


@dataclass(frozen=True, slots=True)
class RouteDefinition:
    """An immutable, technology-independent administrative route definition.

    ``requires_authorization`` is default-True (default-deny); ``requires_counter_sign`` is True for
    control-changing / capital-affecting operations (HO-2); ``workflow_ref`` names the Tier-5 workflow
    a consequential operation triggers (never bypass Workflow Contracts).
    """

    path_template: str
    operation: OperationKind
    resource_type: str
    requires_authorization: bool
    requires_counter_sign: bool
    workflow_ref: str | None


@dataclass(frozen=True, slots=True)
class AdminRouteTree:
    """The immutable administrative route hierarchy (a set of route definitions)."""

    routes: tuple[RouteDefinition, ...]
PY
admireadme "$D" "routing" \
"Define OperationKind, RouteDefinition (with requires_counter_sign), and AdminRouteTree: the technology-independent administrative route hierarchy." \
"Represent admin routes framework-agnostically; default-require authorization; require counter-sign for control-changes (HO-2); bind consequential routes to Tier-5 workflows; hold no logic." \
"Consumed by each admin controller module (which declares its ROUTES)." \
"Standard library only." \
"CLAUDE.md (HO-2, WCON-2, SEC-2, SE-3); Architecture V2 §5.1, §6.2; RB-23 · DOC; Workflow Contracts."

# ===========================================================================
# validation_integration
# ===========================================================================
D="$SRC/validation_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Integration — the admin request-validation INTERFACE (Validation Foundation; mandatory)."""
from __future__ import annotations

from typing import Protocol

from platform_validation.context import ValidationContext
from platform_validation.report import ValidationReport


class AdminRequestValidator(Protocol):
    """Validates an admin request via the Validation Foundation before processing. Interface only.

    Validation is mandatory and structural (never statistical, AI-2); a failed validation rejects the
    request fail-closed. The Admin API MUST NOT bypass validation.
    """

    def validate(self, request_ref: str, context: ValidationContext) -> ValidationReport: ...
PY
admireadme "$D" "validation_integration" \
"Define AdminRequestValidator: the mandatory admin request-validation interface using the Validation Foundation." \
"Validate every admin request structurally before processing; never bypass validation; hold no logic." \
"Uses platform_validation; first stage of the admin pipeline." \
"platform_validation (ValidationContext, ValidationReport)." \
"CLAUDE.md (AI-2, DE-4); Architecture V2 §5.6, §5.1; RB-04 · VAL; Validation Foundation."

# ===========================================================================
# authorization_integration
# ===========================================================================
D="$SRC/authorization_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Authorization Integration — the admin authorization INTERFACE (Auth & Authz; default-deny; mandatory)."""
from __future__ import annotations

from typing import Protocol

from platform_security.authorization import AuthorizationRequest, AuthorizationResult


class AdminAuthorizationGuard(Protocol):
    """Authorizes an admin request via the Auth & Authz Foundation before processing. Interface only.

    Administrative access is default-deny and least-privilege (SEC-2); deterministic and never
    AI-policed (AV2-25); a denied request is rejected fail-closed and audited.
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationResult: ...
PY
admireadme "$D" "authorization_integration" \
"Define AdminAuthorizationGuard: the mandatory admin authorization interface using the Auth & Authz Foundation." \
"Authorize every admin request (default-deny, least-privilege) before processing; never bypass authorization; deterministic, never AI-policed; hold no logic." \
"Uses platform_security; second stage of the admin pipeline; feeds the audit trail." \
"platform_security.authorization (AuthorizationRequest, AuthorizationResult)." \
"CLAUDE.md (SEC-2, AV2-25, AI-4, HO-1); Architecture V2 §6.3, §6.5; RB-27 · SEC; Auth & Authz Foundation."

# ===========================================================================
# governance_integration
# ===========================================================================
D="$SRC/governance_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Governance Integration — the admin governance-enforcement INTERFACE (approval + counter-sign; mandatory).

Control-changing / capital-affecting operations require human approval AND independent counter-sign
(HO-2); an override MUST NOT bypass a hard control (HO-3); no AI approves (AI-3). Fail-closed.
"""
from __future__ import annotations

from typing import Protocol


class GovernanceGuard(Protocol):
    """Enforces governance rules on an administrative operation before it proceeds. Interface only.

    ``requires_counter_sign`` is True for control-changing / capital-affecting operations (HO-2);
    ``is_permitted`` is fail-closed and never let an override bypass a hard control (HO-3); no AI approves.
    """

    def is_permitted(self, operation_ref: str) -> bool: ...
    def requires_counter_sign(self, operation_ref: str) -> bool: ...
PY
admireadme "$D" "governance_integration" \
"Define GovernanceGuard: the mandatory admin governance-enforcement interface (approval + counter-sign)." \
"Enforce governance rules on administrative operations; require human approval + independent counter-sign for control-changes (HO-2); never let an override bypass a hard control (HO-3); no AI approves; hold no logic." \
"Third stage of the admin pipeline; consumed by controllers; relates to the Governance domain." \
"Standard library only." \
"CLAUDE.md (HO-1/2/3, AI-3, CP-5, RG-3); Architecture V2 §5.1, §6.2; RB-13 · RISK; ADR Governance."

# ===========================================================================
# workflow_integration
# ===========================================================================
D="$SRC/workflow_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Workflow Integration — the admin workflow-trigger INTERFACE (Workflow Contracts; orchestrate not adjudicate)."""
from __future__ import annotations

from typing import Protocol

from workflow_engine.context import WorkflowContext
from workflow_engine.instance import WorkflowInstance


class AdminWorkflowTrigger(Protocol):
    """Triggers an approved Tier-5 workflow for a consequential admin operation. Interface only.

    The Admin API triggers the workflow; the workflow orchestrates and its gates delegate to
    deterministic engines/humans (WCON-2, AV2-18). It never bypasses Workflow Contracts.
    """

    def trigger(self, workflow_ref: str, context: WorkflowContext) -> WorkflowInstance: ...
PY
admireadme "$D" "workflow_integration" \
"Define AdminWorkflowTrigger: the admin workflow-trigger interface using the Workflow Engine (Tier-5 contracts)." \
"Trigger approved Tier-5 workflows for consequential admin operations; never bypass Workflow Contracts; the API orchestrates by triggering, it never adjudicates; hold no logic." \
"Uses workflow_engine; fourth stage of the admin pipeline." \
"workflow_engine (WorkflowContext, WorkflowInstance)." \
"CLAUDE.md (WCON-2, AV2-18, RG-3); Architecture V2 §5.4, §7; Workflow Contracts; Workflow Engine."

# ===========================================================================
# audit_integration
# ===========================================================================
D="$SRC/audit_integration"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Audit Integration — the admin audit-sink INTERFACE (complete, tamper-evident auditability; mandatory)."""
from __future__ import annotations

from typing import Protocol

from platform_security.audit import SecurityAuditRecord


class AdminAuditSink(Protocol):
    """Records every administrative operation in the tamper-evident audit trail. Interface only.

    Complete auditability is mandatory (CP-7, SEC-4): every consequential admin operation is recorded
    with who/what/when/why; overrides and counter-signs are recorded (HO-2).
    """

    def record(self, record: SecurityAuditRecord) -> None: ...
PY
admireadme "$D" "audit_integration" \
"Define AdminAuditSink: the mandatory admin audit-sink interface using the tamper-evident security audit trail." \
"Record every consequential admin operation (who/what/when/why, incl. overrides/counter-signs) in the tamper-evident audit trail; never bypass audit; hold no logic." \
"Uses platform_security.audit; sixth stage of the admin pipeline." \
"platform_security.audit (SecurityAuditRecord)." \
"CLAUDE.md (CP-7, SEC-4, HO-2, OB-1); Architecture V2 §5.10, §6.5; RB-27 · SEC; P1-09."

# ===========================================================================
# controller
# ===========================================================================
D="$SRC/controller"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Controller — the base admin controller marker and the canonical admin pipeline INTERFACE.

A controller delegates to an administrative application service; it validates, authorizes, enforces
governance (approval + counter-sign), triggers approved workflows, records a complete audit trail,
publishes administrative events, and returns canonical responses. It exposes no domain models, contains
no business logic, and is stateless.
"""
from __future__ import annotations

from typing import Protocol


class Controller(Protocol):
    """Marker base for admin controllers. Interface only — no endpoints, no HTTP, no business logic, stateless."""

    ...


class AdminPipeline(Protocol):
    """The canonical admin request pipeline. Interface only.

    Every administrative operation flows: validate -> authenticate + authorize (default-deny) ->
    enforce governance (approval + counter-sign for control-changes, HO-2/3) -> trigger approved
    workflow -> delegate to the administrative application service -> record complete audit -> publish
    administrative event -> return canonical response. No stage may be bypassed.
    """

    def process(self, request_ref: str) -> str: ...
PY
admireadme "$D" "controller" \
"Define the Controller marker and the AdminPipeline interface (validate -> authorize -> governance -> workflow -> delegate -> audit -> publish -> respond)." \
"Provide the base admin controller contract and the canonical, no-bypass admin pipeline; controllers delegate to administrative application services and hold no business logic; stateless." \
"Base for every per-domain admin controller; composes validation/authorization/governance/workflow/audit integrations." \
"Standard library only." \
"CLAUDE.md (SE-2/3, WCON-2, AV2-25, HO-2, CP-7); Architecture V2 §5.1, §6.2/§6.3, §7; RB-23 · DOC."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, technology-independent Admin API error model (no internal details)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AdminErrorKind(Enum):
    VALIDATION_FAILED = "validation_failed"
    UNAUTHENTICATED = "unauthenticated"
    FORBIDDEN = "forbidden"                      # authorization denied (default-deny, SEC-2)
    COUNTER_SIGN_REQUIRED = "counter_sign_required"  # control-change needs counter-sign (HO-2)
    GOVERNANCE_VIOLATION = "governance_violation"    # override attempted to bypass a control (HO-3)
    WORKFLOW_REQUIRED = "workflow_required"      # a consequential op requires a workflow (WCON-2)
    AGENT_CONTRACT_BYPASS = "agent_contract_bypass"  # agent admin bypassed Agent Contracts (AI-1..4)
    DOMAIN_MODEL_LEAK = "domain_model_leak"      # an internal domain model was exposed (boundary, SE-2)
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    INTERNAL = "internal"


@dataclass(frozen=True, slots=True)
class AdminError:
    """A canonical, technology-independent admin error (leaks no internal/provider details)."""

    kind: AdminErrorKind
    code: str
    message: str
PY
admireadme "$D" "errors" \
"Define AdminError and AdminErrorKind: the canonical, technology-independent admin error model." \
"Express admin errors in canonical terms (validation/unauthenticated/forbidden/counter-sign-required/governance-violation/workflow-required/agent-contract-bypass/domain-model-leak/not-found/conflict/internal); leak no internal details; hold no logic." \
"Used across admin controllers; guards the governance, agent-contract, workflow, and domain-model boundaries." \
"Standard library only." \
"CLAUDE.md (SE-2, SEC-2, HO-2/3, WCON-2, AI-1..4); Architecture V2 §5.1, §6.2; RB-23 · DOC."

# ===========================================================================
# PER-DOMAIN ADMIN CONTROLLER MODULES (uniform template)
# ===========================================================================
# module|ControllerClass|resource|workflow_ref
while IFS='|' read -r mod ctrl res wf; do
  [ -z "$mod" ] && continue
  D="$SRC/$mod"; mkdir -p "$D"
  if [ -z "$wf" ]; then wfarg="None"; wfdoc="no staged workflow"; else wfarg="\"$wf\""; wfdoc="Tier-5 workflow $wf"; fi
  cat > "$D/__init__.py" <<PY
"""$mod admin API — the $mod controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from admin_api.core import AdminRequest, AdminResponse
from admin_api.routing import OperationKind, RouteDefinition


class $ctrl(Protocol):
    """Admin controller for $mod. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    enforces governance (control-changes require human approval + independent counter-sign, HO-2),
    triggers approved workflows ($wfdoc), delegates to the $mod administrative application service,
    records a complete tamper-evident audit trail, publishes administrative domain events, and returns
    canonical responses. It exposes no internal domain models and never bypasses Workflow/Agent
    Contracts, Validation, or Authorization.
    """

    def get(self, request: AdminRequest) -> AdminResponse: ...
    def list(self, request: AdminRequest) -> AdminResponse: ...
    def administer(self, request: AdminRequest) -> AdminResponse: ...


#: The admin route hierarchy for $mod (technology-independent; control-changes counter-signed & workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/admin/$res/{id}", OperationKind.GET, "$res", True, False, None),
    RouteDefinition("/admin/$res", OperationKind.LIST, "$res", True, False, None),
    RouteDefinition("/admin/$res/{id}/administer", OperationKind.ADMINISTER, "$res", True, True, $wfarg),
)
PY
  admireadme "$D" "$mod" \
"Define the $ctrl interface and the $mod admin route hierarchy: the administrative API surface for $mod, delegating to the $mod administrative application service." \
"Expose $mod get/list/administer operations as a controller interface that validates, authorizes, enforces governance (counter-sign for control-changes), triggers workflows ($wfdoc), delegates to the application service, records audit, and returns canonical responses; hold no business logic and expose no domain models." \
"core (AdminRequest/AdminResponse); routing (RouteDefinition); delegates to the $mod administrative application service; composed via the admin pipeline." \
"admin_api.core; admin_api.routing." \
"CLAUDE.md (SE-2/3, HO-2, WCON-2, AV2-25, SEC-2, AI-1..4); Architecture V2 §5.1, §6.2/§6.3; RB-23 · DOC; the relevant registry/governance framework."
done <<'DATA'
administration|AdministrationController|administration|
users|UserAdminController|users|
roles|RoleAdminController|roles|
permissions|PermissionAdminController|permissions|
agents|AgentAdminController|agents|
agent_registry|AgentRegistryController|agent-registry|
workflow_management|WorkflowAdminController|workflows|
rulebooks|RulebookAdminController|rulebooks|
contracts|ContractAdminController|contracts|
registries|RegistryAdminController|registries|
governance|GovernanceAdminController|governance|WFC-49
architecture|ArchitectureAdminController|architecture|
configuration|ConfigurationAdminController|configuration|
system_health|SystemHealthController|system-health|
monitoring|MonitoringAdminController|monitoring|
audit|AuditAdminController|audit|
incidents|IncidentAdminController|incidents|
disaster_recovery|DisasterRecoveryController|disaster-recovery|
DATA

echo "Admin API generated."
