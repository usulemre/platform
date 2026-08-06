"""portfolios API — the portfolios controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class PortfolioController(Protocol):
    """API controller for portfolios. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-48), delegates to the portfolios application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the portfolios resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/portfolios", OperationKind.CREATE, "portfolios", True, "WFC-48"),
    RouteDefinition("/portfolios/{id}", OperationKind.READ, "portfolios", True, None),
    RouteDefinition("/portfolios", OperationKind.LIST, "portfolios", True, None),
    RouteDefinition("/portfolios/{id}/actions", OperationKind.ACTION, "portfolios", True, "WFC-48"),
)
