"""governance API — the governance controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class GovernanceController(Protocol):
    """API controller for governance. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-49), delegates to the governance application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the governance resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/governance", OperationKind.CREATE, "governance", True, "WFC-49"),
    RouteDefinition("/governance/{id}", OperationKind.READ, "governance", True, None),
    RouteDefinition("/governance", OperationKind.LIST, "governance", True, None),
    RouteDefinition("/governance/{id}/actions", OperationKind.ACTION, "governance", True, "WFC-49"),
)
