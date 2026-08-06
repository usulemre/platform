"""users admin API — the users controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from admin_api.core import AdminRequest, AdminResponse
from admin_api.routing import OperationKind, RouteDefinition


class UserAdminController(Protocol):
    """Admin controller for users. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    enforces governance (control-changes require human approval + independent counter-sign, HO-2),
    triggers approved workflows (no staged workflow), delegates to the users administrative application service,
    records a complete tamper-evident audit trail, publishes administrative domain events, and returns
    canonical responses. It exposes no internal domain models and never bypasses Workflow/Agent
    Contracts, Validation, or Authorization.
    """

    def get(self, request: AdminRequest) -> AdminResponse: ...
    def list(self, request: AdminRequest) -> AdminResponse: ...
    def administer(self, request: AdminRequest) -> AdminResponse: ...


#: The admin route hierarchy for users (technology-independent; control-changes counter-signed & workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/admin/users/{id}", OperationKind.GET, "users", True, False, None),
    RouteDefinition("/admin/users", OperationKind.LIST, "users", True, False, None),
    RouteDefinition("/admin/users/{id}/administer", OperationKind.ADMINISTER, "users", True, True, None),
)
