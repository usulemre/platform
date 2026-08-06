#!/usr/bin/env bash
#
# generate_authz_foundation.sh — Phase 3.5 Authentication & Authorization Foundation generator.
#
# Governed by: CLAUDE.md (SEC-1..5, SEC-2 least-privilege/need-to-know, AV2-25 deterministic
#              enforcement/never-AI-policed, AI-1..4 agent authority, HO-1, DE-1, CP-7); Architecture V2
#              §6.5 (Security Boundary), §6.3; Implementation Roadmap Phase 1/5; RB-27 · SEC; TDR §18.
#
# Emits the Authentication & Authorization Foundation under packages/security as `platform_security`:
# identity core, principal registry, role management, permission model, access control, security
# context, authentication, authorization, policy engine, audit support, identity lifecycle, security
# events, and the error model. It reuses core_domain (authority spine + shared kernel) and the platform
# contract kernel.
#
# It is the VENDOR/TECHNOLOGY-INDEPENDENT security abstraction: canonical interfaces ONLY. Authorization
# is DETERMINISTIC and NEVER AI-policed (AV2-25); access is LEAST-PRIVILEGE / default-deny (SEC-2);
# AI-agent identities have a propose/narrate authority ceiling (never decide/approve, AI-1..4); service
# identities are first-class. It contains NO authentication protocols, NO OAuth/JWT/SSO, NO
# authentication-provider, NO persistence, NO infrastructure. Deterministic, immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/security"
SRC="$PKG/src/platform_security"
cd "$ROOT"

# robust README helper (order: Purpose, Responsibilities, Relationships, Dependencies, Governance)
secreadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# security · $name

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

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
# security — the Authentication & Authorization Foundation abstractions (Phase 3.5).
# Standard library + foundations only (contracts, core-domain). No OAuth/JWT/SSO/provider/persistence deps.
[project]
name = "platform-security"
version = "0.1.0"
description = "Auth & authz abstractions: identity, principal, role, permission, policy, access control."
requires-python = ">=3.12"
dependencies = ["platform-contracts", "core-domain"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_security"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# security — Authentication & Authorization Foundation implemented in Phase 3.5

This package now contains the Authentication & Authorization Foundation (the `platform_security`
package): identity core, principal registry, role management, permission model, access control,
security context, authentication, authorization, policy engine, audit support, identity lifecycle,
security events, and the error model. Authentication protocols, OAuth/JWT/SSO, authentication
providers, persistence, and infrastructure remain forbidden here. Concrete providers (Keycloak/OIDC
for identity, OPA for policy, SPIFFE/SPIRE for workload identity, per the TDR) plug in behind these
canonical interfaces.
MD

cat > "$PKG/README.md" <<'MD'
# security (package) — `platform_security`

> **Phase 3.5 — Authentication & Authorization Foundation (implemented).** The institutional identity,
> authentication, and authorization architecture used by all platform components — the canonical
> security abstractions for users, AI agents, services, and system identities. **Abstractions only** —
> no authentication protocols, no OAuth/JWT/SSO, no provider, no infrastructure.

## Purpose
Define the vendor/technology-independent security interfaces (AV2 §6.5, SEC-1..5, TDR §18). Concrete
providers — Keycloak/OIDC (identity), Open Policy Agent (authorization policy), SPIFFE/SPIRE (workload
identity) — plug in **behind** these interfaces. **Authorization is a control**: it is **deterministic,
versioned, and golden-testable, and is never AI-policed** (AV2-25, DE-1); access is **least-privilege /
default-deny** (SEC-2). It reuses the platform's authority spine (`core_domain.shared.Authority`).

## What is here (Phase 3.5)
13 modules, each a subpackage with its own `README.md`:
`identity` · `registry` · `roles` · `permissions` · `access_control` · `context` · `authentication` ·
`authorization` · `policy_engine` · `audit` · `lifecycle` · `events` · `errors`.

- **Canonical models:** `Principal`, `UserIdentity`, `ServiceIdentity`, `AgentIdentity`, `Role`,
  `Permission`, `PermissionSet`, `SecurityPolicy`, `AccessDecision`, `SecurityContext`,
  `AuthenticationRequest`, `AuthenticationResult`, `AuthorizationRequest`, `AuthorizationResult`.
- **Identity types** (`identity.IdentityType`): Human Users · AI Agents · Internal Services · Workflow
  Engine · Scheduler · System Administrators · Monitoring Components.
- **Lifecycle:** `REGISTERED → AUTHENTICATING → AUTHENTICATED → AUTHORIZED → ACTIVE → EXPIRED →
  REVOKED` (+ `SUSPENDED`), supporting renewal, revocation, suspension, and delegation; skips forbidden
  (fail-closed).
- **Domain events:** `IdentityRegistered`, `AuthenticationRequested`, `AuthenticationSucceeded`,
  `AuthenticationFailed`, `AuthorizationGranted`, `AuthorizationDenied`, `RoleAssigned`,
  `PermissionGranted`, `PermissionRevoked`, `IdentityRevoked`.

## Boundary rules (verified)
- **Deterministic authorization, never AI-policed (AV2-25):** `Authorizer`/`PolicyEngine` are
  deterministic interfaces; `AI_AUTHORIZATION_ATTEMPT`, `HUMAN_OVERRIDE_BY_AI` errors.
- **Least-privilege / default-deny (SEC-2):** `AccessControl.is_allowed` yields a default-deny
  `AccessDecision`; `Permission`/`PermissionSet`/`Role` are role-based; `ACCESS_DENIED`,
  `PRIVILEGE_ESCALATION` errors.
- **AI-agent + service identities:** `AgentIdentity.authority` is a `propose`/`narrate` ceiling (never
  `decide`/`approve`, AI-1..4; `AGENT_AUTHORITY_EXCEEDED` error); `ServiceIdentity` (SPIFFE workload id).
- **No credentials / protocols:** `AuthenticationRequest` carries a credential *reference* (no
  password/JWT); no OAuth/JWT/SSO/provider imports (verified by scan).
- **Auditable:** every access decision is auditable via a tamper-evident `SecurityAuditTrail` (SEC-2/4).
- **Immutable:** all models/policies/events are `frozen` dataclasses (runtime `FrozenInstanceError`);
  register-before-use.
- **Compiles and imports cleanly**, 13 modules, no circular dependencies.

## Ownership
Accountable role: CISO. Architecture owner: ARB.

## Dependencies
`platform_contracts`, `core_domain`.

## Regeneration
Generated by [`tools/scaffolding/generate_authz_foundation.sh`](../../tools/scaffolding/generate_authz_foundation.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (SEC-1..5, AV2-25, AI-1..4, HO-1, DE-1, CP-7); Architecture V2 §6.5, §6.3;
Implementation Roadmap Phase 1/5; RB-27 · SEC; RB-15 · AIGOV; Technology Decision Record §18.
MD

cat > "$SRC/__init__.py" <<'PY'
"""platform_security — the Authentication & Authorization Foundation.

Defines the institutional identity, authentication, and authorization architecture used by all
platform components: the canonical security abstractions for users, AI agents, services, and system
identities.

Authority (SEC-2, AV2-25, AI-1..4): authorization is deterministic and NEVER AI-policed; access is
least-privilege / default-deny; AI-agent identities carry a propose/narrate authority ceiling (never
decide/approve); service identities are first-class. It reuses core_domain (authority spine + shared
kernel) and the platform contract kernel.

Boundaries: no authentication protocols, no OAuth/JWT/SSO, no authentication provider, no persistence,
no infrastructure. Concrete providers (Keycloak/OIDC, OPA, SPIFFE/SPIRE, per the TDR) plug in behind
these interfaces.

Modules: identity, registry, roles, permissions, access_control, context, authentication,
authorization, policy_engine, audit, lifecycle, events, errors.
"""
from __future__ import annotations

from . import (
    access_control,
    audit,
    authentication,
    authorization,
    context,
    errors,
    events,
    identity,
    lifecycle,
    permissions,
    policy_engine,
    registry,
    roles,
)

__all__ = [
    "identity", "registry", "roles", "permissions", "access_control", "context", "authentication",
    "authorization", "policy_engine", "audit", "lifecycle", "events", "errors",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Identity Lifecycle — the canonical authn/authz lifecycle states, transitions, status, and service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class IdentityLifecycle(Enum):
    """The canonical identity/credential lifecycle (plus SUSPENDED)."""

    REGISTERED = "registered"
    AUTHENTICATING = "authenticating"
    AUTHENTICATED = "authenticated"
    AUTHORIZED = "authorized"
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPENDED = "suspended"


L = IdentityLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[IdentityLifecycle, IdentityLifecycle], ...] = (
    (L.REGISTERED, L.AUTHENTICATING),
    (L.AUTHENTICATING, L.AUTHENTICATED),
    (L.AUTHENTICATED, L.AUTHORIZED),
    (L.AUTHORIZED, L.ACTIVE),
    (L.ACTIVE, L.EXPIRED),
    # authentication failure
    (L.AUTHENTICATING, L.REGISTERED),
    # renewal (re-authenticate)
    (L.EXPIRED, L.AUTHENTICATING),
    (L.ACTIVE, L.AUTHENTICATING),
    # suspension / resume
    (L.ACTIVE, L.SUSPENDED),
    (L.SUSPENDED, L.ACTIVE),
    # revocation (from any live state)
    (L.ACTIVE, L.REVOKED),
    (L.SUSPENDED, L.REVOKED),
    (L.EXPIRED, L.REVOKED),
    (L.AUTHORIZED, L.REVOKED),
)

#: Terminal state.
TERMINAL_STATES: frozenset[IdentityLifecycle] = frozenset({L.REVOKED})


@dataclass(frozen=True, slots=True)
class IdentityStatus:
    """The current lifecycle status of an identity (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: IdentityLifecycle
    since: str


class IdentityLifecycleService(Protocol):
    """Governs identity lifecycle transitions and supported operations. Interface only.

    Supports renewal, revocation, suspension, and delegation (bounded, recorded); no protocol here.
    A human governance decision cannot be overridden by AI (HO-1).
    """

    def transition(self, principal: Id, to: IdentityLifecycle) -> None: ...
    def renew(self, principal: Id) -> None: ...
    def revoke(self, principal: Id) -> None: ...
    def suspend(self, principal: Id) -> None: ...
    def delegate(self, principal: Id, to_principal: Id) -> None: ...
PY
secreadme "$D" "lifecycle" \
"Define IdentityLifecycle (REGISTERED/AUTHENTICATING/AUTHENTICATED/AUTHORIZED/ACTIVE/EXPIRED/REVOKED + SUSPENDED), the canonical transitions, IdentityStatus, and the lifecycle service (renewal/revocation/suspension/delegation)." \
"Enumerate the identity/credential lifecycle and legal transitions as data and expose lifecycle operations; hold no authentication protocol; a human decision is never AI-overridden." \
"Consumed by identity, registry, authentication, events." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (SEC-2, HO-1, CS-3, RL-1); Architecture V2 §6.5; RB-27 · SEC."

# ===========================================================================
# identity
# ===========================================================================
D="$SRC/identity"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Identity Core — the canonical principal and identity types (user/service/agent; authority spine)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import ActorKind, Authority

from platform_security.lifecycle import IdentityStatus


class IdentityType(Enum):
    """The canonical identity types on the platform."""

    HUMAN_USER = "human_user"
    AI_AGENT = "ai_agent"
    INTERNAL_SERVICE = "internal_service"
    WORKFLOW_ENGINE = "workflow_engine"
    SCHEDULER = "scheduler"
    SYSTEM_ADMINISTRATOR = "system_administrator"
    MONITORING_COMPONENT = "monitoring_component"


@dataclass(frozen=True, slots=True)
class IdentityIdentifier:
    """A stable, immutable identity reference."""

    value: str


@dataclass(frozen=True, slots=True)
class Principal:
    """A canonical security principal (any authenticated identity).

    ``kind`` maps to the authority spine actor kind (human / deterministic engine / AI agent).
    """

    identifier: IdentityIdentifier
    identity_type: IdentityType
    kind: ActorKind
    status: IdentityStatus


@dataclass(frozen=True, slots=True)
class UserIdentity:
    """A human user identity. Named humans are accountable for consequential outcomes (HO-1)."""

    principal: Principal
    role_refs: tuple[str, ...]
    accountable: bool


@dataclass(frozen=True, slots=True)
class ServiceIdentity:
    """An internal service (workload) identity, referenced by workload id (SPIFFE, per TDR)."""

    principal: Principal
    workload_id: str


@dataclass(frozen=True, slots=True)
class AgentIdentity:
    """An AI agent identity.

    Its ``authority`` is a ceiling of ``PROPOSE`` or ``NARRATE`` — an AI agent NEVER holds ``DECIDE``
    or ``APPROVE`` (AI-1..4). Model pinning / eval are governed by the Agent Registry (referenced).
    """

    principal: Principal
    authority: Authority
    agent_registry_ref: str
PY
secreadme "$D" "identity" \
"Define IdentityType (7 types), IdentityIdentifier, Principal, UserIdentity, ServiceIdentity, and AgentIdentity (with a propose/narrate authority ceiling)." \
"Provide the canonical principal and identity types for users/agents/services/system; encode human accountability and the AI-agent authority ceiling; hold no protocol." \
"Consumed by registry, roles, access_control, authentication; reuses the authority spine." \
"core_domain.shared (Authority, ActorKind); lifecycle (IdentityStatus)." \
"CLAUDE.md (SEC-2, AI-1..4, HO-1, AG-1..4); Architecture V2 §5.3, §6.5; RB-27 · SEC; RB-15 · AIGOV; TDR §18."

# ===========================================================================
# permissions
# ===========================================================================
D="$SRC/permissions"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Permission Model — least-privilege permissions and permission sets (default-deny, SEC-2)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class PermissionEffect(Enum):
    ALLOW = "allow"
    DENY = "deny"


@dataclass(frozen=True, slots=True)
class Permission:
    """A least-privilege permission: an action on a resource.

    Access is default-deny beyond explicitly granted permissions (SEC-2); an explicit DENY overrides.
    """

    resource: str
    action: str
    effect: PermissionEffect


@dataclass(frozen=True, slots=True)
class PermissionSet:
    """An immutable set of permissions (the grant bundled into a role)."""

    permissions: tuple[Permission, ...]
PY
secreadme "$D" "permissions" \
"Define Permission, PermissionEffect, and PermissionSet: least-privilege permissions and their sets." \
"Represent least-privilege permissions (resource + action + effect) and bundles; default-deny beyond granted; hold no logic." \
"Consumed by roles, access_control, authorization." \
"Standard library only." \
"CLAUDE.md (SEC-2, AV2-25); Architecture V2 §6.5; RB-27 · SEC."

# ===========================================================================
# roles
# ===========================================================================
D="$SRC/roles"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Role Management — the role model, role assignment, and role-management INTERFACE (RBAC; no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class Role:
    """A role bundling a permission set (role-based authorization)."""

    name: str
    permission_set_ref: str
    description: str


@dataclass(frozen=True, slots=True)
class RoleAssignment:
    """An immutable assignment of a role to a principal (recorded, auditable)."""

    principal_ref: str
    role: str


class RoleManagementService(Protocol):
    """Assigns/revokes roles (RBAC). Interface only — least-privilege; recorded and auditable."""

    def assign_role(self, assignment: RoleAssignment) -> None: ...
    def revoke_role(self, principal: Id, role: str) -> None: ...
PY
secreadme "$D" "roles" \
"Define Role, RoleAssignment, and the RoleManagementService interface: role-based authorization." \
"Represent roles (bundling permission sets) and their assignment/revocation; recorded and auditable; hold no logic." \
"Consumed by authorization/policy_engine; references permission sets." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (SEC-2, CP-7); Architecture V2 §6.5; RB-27 · SEC."

# ===========================================================================
# context
# ===========================================================================
D="$SRC/context"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Security Context — the immutable per-request security context (no credentials, SEC-3)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import ActorRef
from platform_contracts.common import CorrelationId


@dataclass(frozen=True, slots=True)
class SecurityContext:
    """Immutable security context for a request.

    It carries the authenticated principal and actor (with authority) and a correlation id for
    traceability; it carries NO credentials (SEC-3).
    """

    principal_ref: str
    actor: ActorRef
    correlation_id: CorrelationId
PY
secreadme "$D" "context" \
"Define SecurityContext: the immutable per-request security context (principal, actor with authority, correlation)." \
"Carry the authenticated principal/actor and correlation for traceability; carry no credentials; hold no logic." \
"Consumed by authorization and audit; correlates every security decision." \
"core_domain.shared (ActorRef); platform_contracts.common (CorrelationId)." \
"CLAUDE.md (SEC-3, CP-7, CS-3); Architecture V2 §6.5; RB-27 · SEC."

# ===========================================================================
# access_control
# ===========================================================================
D="$SRC/access_control"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Access Control — the access decision model and access-control INTERFACE (default-deny; deterministic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class AccessEffect(Enum):
    ALLOW = "allow"
    DENY = "deny"


@dataclass(frozen=True, slots=True)
class AccessDecision:
    """A deterministic, explainable access decision (default-deny, SEC-2; explainable, EXP-2)."""

    effect: AccessEffect
    rationale: str


class AccessControl(Protocol):
    """Deterministically decides access. Interface only.

    Access is default-deny and least-privilege (SEC-2); enforcement is deterministic, never AI-policed
    (AV2-25); every decision is auditable.
    """

    def is_allowed(self, principal: Id, resource: str, action: str) -> AccessDecision: ...
PY
secreadme "$D" "access_control" \
"Define AccessEffect, AccessDecision, and the AccessControl interface: deterministic, default-deny access control." \
"Express deterministic, default-deny, least-privilege access decisions (explainable); enforcement is deterministic and never AI-policed; hold no logic." \
"Consumed by services/engines; uses roles/permissions; feeds audit." \
"platform_contracts.common (Id); standard library." \
"CLAUDE.md (SEC-2, AV2-25, EXP-2); Architecture V2 §6.5, §6.3; RB-27 · SEC."

# ===========================================================================
# authentication
# ===========================================================================
D="$SRC/authentication"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Authentication — the authentication request/result model and authenticator INTERFACE (no protocol).

Carries a credential REFERENCE (assertion/secret ref), never a password/JWT (SEC-3). No OAuth/JWT/SSO
protocol here — the concrete IdP (Keycloak/OIDC) plugs in behind the interface.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol


class AuthMethod(Enum):
    NONE = "none"
    CREDENTIAL_REF = "credential_ref"  # a reference to a credential/assertion (never inlined)
    MTLS = "mtls"
    OIDC = "oidc"
    WORKLOAD = "workload"              # workload identity (SPIFFE)


@dataclass(frozen=True, slots=True)
class AuthenticationRequest:
    """An authentication request. ``credential_ref`` is a reference only; no password/JWT (SEC-3)."""

    identity_ref: str
    method: AuthMethod
    credential_ref: str


@dataclass(frozen=True, slots=True)
class AuthenticationResult:
    """The immutable outcome of authentication (no token bytes; a session reference only)."""

    authenticated: bool
    session_ref: str | None
    rationale: str


class Authenticator(Protocol):
    """Authenticates an identity. Interface only — no OAuth/JWT/SSO/protocol here.

    The concrete identity provider (Keycloak/OIDC, per TDR) plugs in behind this interface.
    """

    def authenticate(self, request: AuthenticationRequest) -> AuthenticationResult: ...
PY
secreadme "$D" "authentication" \
"Define AuthMethod, AuthenticationRequest, AuthenticationResult, and the Authenticator interface." \
"Represent authentication requests/results with credential references only (no password/JWT) and expose an authenticator interface; hold no OAuth/JWT/SSO protocol." \
"Consumed by services/gateways; the concrete IdP plugs in behind the interface." \
"Standard library only." \
"CLAUDE.md (SEC-3, SEC-2, CODE-29); Architecture V2 §6.5; RB-27 · SEC; TDR §18."

# ===========================================================================
# authorization
# ===========================================================================
D="$SRC/authorization"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Authorization — the authorization request/result model and authorizer INTERFACE (deterministic).

An LLM MUST NEVER make an authorization decision (AV2-25, AIGOV-E-2); authorization is deterministic,
role/permission-based, and least-privilege.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class AuthorizationRequest:
    """An authorization request: a principal seeking an action on a resource, in a security context."""

    principal_ref: str
    resource: str
    action: str
    context_ref: str


@dataclass(frozen=True, slots=True)
class AuthorizationResult:
    """A deterministic, explainable authorization outcome (least-privilege; default-deny)."""

    granted: bool
    rationale: str


class Authorizer(Protocol):
    """Deterministically authorizes an action (role/permission-based, least-privilege). Interface only.

    An LLM MUST NEVER make an authorization decision (AV2-25); enforcement is deterministic.
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationResult: ...
PY
secreadme "$D" "authorization" \
"Define AuthorizationRequest, AuthorizationResult, and the Authorizer interface: deterministic, least-privilege authorization." \
"Express deterministic, role/permission-based authorization (default-deny, explainable); an LLM never authorizes; hold no logic." \
"Consumed by access_control and services; evaluated by the policy engine." \
"Standard library only." \
"CLAUDE.md (SEC-2, AV2-25, DE-1, AI-4); Architecture V2 §6.5, §6.3; RB-27 · SEC."

# ===========================================================================
# policy_engine
# ===========================================================================
D="$SRC/policy_engine"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Policy Engine — the security policy model and deterministic policy-evaluation INTERFACE (OPA-style).

Security policies are deterministic, versioned, and golden-testable code (RBAC/ABAC); no AI evaluates
policy (AV2-25, DE-1). The concrete engine (Open Policy Agent, per TDR) plugs in behind the interface.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import SchemaVersion

from platform_security.authorization import AuthorizationRequest, AuthorizationResult


@dataclass(frozen=True, slots=True)
class SecurityPolicy:
    """A named, versioned, deterministic authorization policy (RBAC/ABAC). Immutable; a change is a new version."""

    name: str
    version: SchemaVersion
    description: str


class PolicyEngine(Protocol):
    """Evaluates security policies deterministically. Interface only.

    Policies are versioned, golden-testable code; the evaluation is deterministic and never performed
    by an AI (AV2-25, DE-1).
    """

    def evaluate(self, request: AuthorizationRequest) -> AuthorizationResult: ...
PY
secreadme "$D" "policy_engine" \
"Define SecurityPolicy (versioned) and the PolicyEngine interface: deterministic authorization-policy evaluation." \
"Represent versioned RBAC/ABAC policies and expose deterministic, golden-testable evaluation; no AI evaluates policy; hold no logic." \
"Consumed by authorization; the concrete engine (OPA) plugs in behind the interface." \
"platform_contracts.common (SchemaVersion); authorization (AuthorizationRequest, AuthorizationResult)." \
"CLAUDE.md (AV2-25, DE-1/2, VER-1, SEC-2); Architecture V2 §6.5, §6.3; RB-27 · SEC; TDR §18."

# ===========================================================================
# registry
# ===========================================================================
D="$SRC/registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Principal Registry — the register-before-use registry of principals (no persistence)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from platform_security.identity import Principal


class IdentityRegistry(Protocol):
    """Register-before-use registry of principals (users/services/agents). Interface only — no persistence.

    An unregistered identity cannot authenticate; registration is append-only and every entry is
    auditable (SEC-2, CP-7).
    """

    def register(self, principal: Principal) -> None: ...
    def get(self, principal: Id) -> Principal: ...
    def is_registered(self, principal: Id) -> bool: ...
PY
secreadme "$D" "registry" \
"Define IdentityRegistry: the register-before-use registry of principals." \
"Express register-before-use, append-only, auditable registration/retrieval of principals as an interface; hold no persistence." \
"Consumed by authentication/authorization; complements the Agent Registry for AI agents." \
"platform_contracts.common (Id); identity (Principal); standard library." \
"CLAUDE.md (SEC-2, CP-7, REG-1); Architecture V2 §6.5, §5.3; RB-27 · SEC; Agent Registry."

# ===========================================================================
# audit
# ===========================================================================
D="$SRC/audit"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Audit Support — the security audit record and tamper-evident audit-trail INTERFACE (SEC-2/4)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class SecurityAuditRecord:
    """An immutable, hash-chained audit record of a security decision (access logging, SEC-2/4, CP-7)."""

    principal_ref: str
    action: str
    decision: str
    prev_hash: str
    entry_hash: str


class SecurityAuditTrail(Protocol):
    """Append-only, tamper-evident security audit trail. Interface only — no persistence.

    Every consequential access decision (esp. crown-jewel assets) is recorded with access logging (SEC-2).
    """

    def append(self, record: SecurityAuditRecord) -> None: ...
PY
secreadme "$D" "audit" \
"Define SecurityAuditRecord and the SecurityAuditTrail interface: tamper-evident security audit / access logging." \
"Represent security decisions as immutable, hash-chained audit records with access logging; append-only; hold no persistence." \
"Fed by access_control/authorization; supports exfiltration detection for crown-jewel assets." \
"Standard library only." \
"CLAUDE.md (SEC-2/4, CP-7); Architecture V2 §6.5; RB-27 · SEC; P1-09."

# ===========================================================================
# events
# ===========================================================================
D="$SRC/events"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Security Domain Events — immutable facts about identity/auth decisions (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class IdentityRegistered(DomainEvent):
    principal_id: EntityId


@dataclass(frozen=True, slots=True)
class AuthenticationRequested(DomainEvent):
    principal_id: EntityId


@dataclass(frozen=True, slots=True)
class AuthenticationSucceeded(DomainEvent):
    principal_id: EntityId


@dataclass(frozen=True, slots=True)
class AuthenticationFailed(DomainEvent):
    principal_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class AuthorizationGranted(DomainEvent):
    principal_id: EntityId
    resource: str
    action: str


@dataclass(frozen=True, slots=True)
class AuthorizationDenied(DomainEvent):
    principal_id: EntityId
    resource: str
    action: str


@dataclass(frozen=True, slots=True)
class RoleAssigned(DomainEvent):
    principal_id: EntityId
    role: str


@dataclass(frozen=True, slots=True)
class PermissionGranted(DomainEvent):
    principal_id: EntityId
    permission: str


@dataclass(frozen=True, slots=True)
class PermissionRevoked(DomainEvent):
    principal_id: EntityId
    permission: str


@dataclass(frozen=True, slots=True)
class IdentityRevoked(DomainEvent):
    principal_id: EntityId
    reason: str
PY
secreadme "$D" "events" \
"Define the canonical security domain events: IdentityRegistered, AuthenticationRequested, AuthenticationSucceeded, AuthenticationFailed, AuthorizationGranted, AuthorizationDenied, RoleAssigned, PermissionGranted, PermissionRevoked, IdentityRevoked." \
"Represent identity/auth facts as immutable domain events carrying the domain event envelope; records, not commands." \
"core_domain.shared (DomainEvent, EntityId); flow on the Event Bus and into the audit trail." \
"core_domain.shared (DomainEvent, EntityId)." \
"CLAUDE.md (SEC-2/4, CP-2/7); Architecture V2 §6.5, §5.10; RB-27 · SEC; Event Bus."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, vendor-neutral security error model (no provider details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SecurityErrorKind(Enum):
    UNREGISTERED_IDENTITY = "unregistered_identity"          # register-before-use
    AUTHENTICATION_FAILED = "authentication_failed"
    ACCESS_DENIED = "access_denied"                          # default-deny / least-privilege (SEC-2)
    PRIVILEGE_ESCALATION = "privilege_escalation"            # least-privilege violation
    AGENT_AUTHORITY_EXCEEDED = "agent_authority_exceeded"    # AI agent attempted decide/approve (AI-1..4)
    AI_AUTHORIZATION_ATTEMPT = "ai_authorization_attempt"    # an AI attempted an authz decision (AV2-25)
    HUMAN_OVERRIDE_BY_AI = "human_override_by_ai"            # AI attempted to override a human decision (HO-1, AI-4)
    IDENTITY_REVOKED = "identity_revoked"
    EXPIRED_CREDENTIAL = "expired_credential"


@dataclass(frozen=True, slots=True)
class SecurityError:
    """A canonical, vendor-neutral security error (no provider/vendor details leaked)."""

    kind: SecurityErrorKind
    message: str


class SecurityFrameworkError(Exception):
    """Base exception for the security foundation (framework faults, not provider errors)."""
PY
secreadme "$D" "errors" \
"Define SecurityError, SecurityErrorKind, and SecurityFrameworkError: the canonical, vendor-neutral security error model." \
"Express security errors in vendor-neutral terms (unregistered/auth-failed/access-denied/privilege-escalation/agent-authority/ai-authorization/human-override/revoked/expired); leak no provider details; hold no logic." \
"Used across the security modules." \
"Standard library only." \
"CLAUDE.md (SEC-2, AV2-25, AI-1..4, HO-1); Architecture V2 §6.5, §6.3; RB-27 · SEC; RB-15 · AIGOV."

echo "Authentication & Authorization Foundation generated."
