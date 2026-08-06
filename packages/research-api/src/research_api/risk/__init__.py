"""risk API — the risk controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class RiskController(Protocol):
    """API controller for risk. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-47), delegates to the risk application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the risk resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/risk", OperationKind.CREATE, "risk", True, "WFC-47"),
    RouteDefinition("/risk/{id}", OperationKind.READ, "risk", True, None),
    RouteDefinition("/risk", OperationKind.LIST, "risk", True, None),
    RouteDefinition("/risk/{id}/actions", OperationKind.ACTION, "risk", True, "WFC-47"),
)
