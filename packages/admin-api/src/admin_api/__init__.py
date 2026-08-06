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
