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
