"""governance admin API — the governance controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from admin_api.core import AdminRequest, AdminResponse
from admin_api.routing import OperationKind, RouteDefinition


class GovernanceAdminController(Protocol):
    """Admin controller for governance. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    enforces governance (control-changes require human approval + independent counter-sign, HO-2),
    triggers approved workflows (Tier-5 workflow WFC-49), delegates to the governance administrative application service,
    records a complete tamper-evident audit trail, publishes administrative domain events, and returns
    canonical responses. It exposes no internal domain models and never bypasses Workflow/Agent
    Contracts, Validation, or Authorization.
    """

    def get(self, request: AdminRequest) -> AdminResponse: ...
    def list(self, request: AdminRequest) -> AdminResponse: ...
    def administer(self, request: AdminRequest) -> AdminResponse: ...


#: The admin route hierarchy for governance (technology-independent; control-changes counter-signed & workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/admin/governance/{id}", OperationKind.GET, "governance", True, False, None),
    RouteDefinition("/admin/governance", OperationKind.LIST, "governance", True, False, None),
    RouteDefinition("/admin/governance/{id}/administer", OperationKind.ADMINISTER, "governance", True, True, "WFC-49"),
)
