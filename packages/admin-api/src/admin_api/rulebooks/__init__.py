"""rulebooks admin API — the rulebooks controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from admin_api.core import AdminRequest, AdminResponse
from admin_api.routing import OperationKind, RouteDefinition


class RulebookAdminController(Protocol):
    """Admin controller for rulebooks. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    enforces governance (control-changes require human approval + independent counter-sign, HO-2),
    triggers approved workflows (no staged workflow), delegates to the rulebooks administrative application service,
    records a complete tamper-evident audit trail, publishes administrative domain events, and returns
    canonical responses. It exposes no internal domain models and never bypasses Workflow/Agent
    Contracts, Validation, or Authorization.
    """

    def get(self, request: AdminRequest) -> AdminResponse: ...
    def list(self, request: AdminRequest) -> AdminResponse: ...
    def administer(self, request: AdminRequest) -> AdminResponse: ...


#: The admin route hierarchy for rulebooks (technology-independent; control-changes counter-signed & workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/admin/rulebooks/{id}", OperationKind.GET, "rulebooks", True, False, None),
    RouteDefinition("/admin/rulebooks", OperationKind.LIST, "rulebooks", True, False, None),
    RouteDefinition("/admin/rulebooks/{id}/administer", OperationKind.ADMINISTER, "rulebooks", True, True, None),
)
