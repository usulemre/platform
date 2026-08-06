"""features API — the features controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class FeatureController(Protocol):
    """API controller for features. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-44), delegates to the features application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the features resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/features", OperationKind.CREATE, "features", True, "WFC-44"),
    RouteDefinition("/features/{id}", OperationKind.READ, "features", True, None),
    RouteDefinition("/features", OperationKind.LIST, "features", True, None),
    RouteDefinition("/features/{id}/actions", OperationKind.ACTION, "features", True, "WFC-44"),
)
