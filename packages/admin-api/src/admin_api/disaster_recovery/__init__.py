"""disaster_recovery admin API — the disaster_recovery controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from admin_api.core import AdminRequest, AdminResponse
from admin_api.routing import OperationKind, RouteDefinition


class DisasterRecoveryController(Protocol):
    """Admin controller for disaster_recovery. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    enforces governance (control-changes require human approval + independent counter-sign, HO-2),
    triggers approved workflows (no staged workflow), delegates to the disaster_recovery administrative application service,
    records a complete tamper-evident audit trail, publishes administrative domain events, and returns
    canonical responses. It exposes no internal domain models and never bypasses Workflow/Agent
    Contracts, Validation, or Authorization.
    """

    def get(self, request: AdminRequest) -> AdminResponse: ...
    def list(self, request: AdminRequest) -> AdminResponse: ...
    def administer(self, request: AdminRequest) -> AdminResponse: ...


#: The admin route hierarchy for disaster_recovery (technology-independent; control-changes counter-signed & workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/admin/disaster-recovery/{id}", OperationKind.GET, "disaster-recovery", True, False, None),
    RouteDefinition("/admin/disaster-recovery", OperationKind.LIST, "disaster-recovery", True, False, None),
    RouteDefinition("/admin/disaster-recovery/{id}/administer", OperationKind.ADMINISTER, "disaster-recovery", True, True, None),
)
