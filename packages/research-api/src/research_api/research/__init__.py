"""research API — the research controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class ResearchController(Protocol):
    """API controller for research. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-43), delegates to the research application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the research resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/research", OperationKind.CREATE, "research", True, "WFC-43"),
    RouteDefinition("/research/{id}", OperationKind.READ, "research", True, None),
    RouteDefinition("/research", OperationKind.LIST, "research", True, None),
    RouteDefinition("/research/{id}/actions", OperationKind.ACTION, "research", True, "WFC-43"),
)
