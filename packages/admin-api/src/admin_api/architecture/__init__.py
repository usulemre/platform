"""architecture admin API — the architecture controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from admin_api.core import AdminRequest, AdminResponse
from admin_api.routing import OperationKind, RouteDefinition


class ArchitectureAdminController(Protocol):
    """Admin controller for architecture. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    enforces governance (control-changes require human approval + independent counter-sign, HO-2),
    triggers approved workflows (no staged workflow), delegates to the architecture administrative application service,
    records a complete tamper-evident audit trail, publishes administrative domain events, and returns
    canonical responses. It exposes no internal domain models and never bypasses Workflow/Agent
    Contracts, Validation, or Authorization.
    """

    def get(self, request: AdminRequest) -> AdminResponse: ...
    def list(self, request: AdminRequest) -> AdminResponse: ...
    def administer(self, request: AdminRequest) -> AdminResponse: ...


#: The admin route hierarchy for architecture (technology-independent; control-changes counter-signed & workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/admin/architecture/{id}", OperationKind.GET, "architecture", True, False, None),
    RouteDefinition("/admin/architecture", OperationKind.LIST, "architecture", True, False, None),
    RouteDefinition("/admin/architecture/{id}/administer", OperationKind.ADMINISTER, "architecture", True, True, None),
)
