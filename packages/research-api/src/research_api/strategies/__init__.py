"""strategies API — the strategies controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class StrategyController(Protocol):
    """API controller for strategies. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (no staged workflow), delegates to the strategies application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the strategies resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/strategies", OperationKind.CREATE, "strategies", True, None),
    RouteDefinition("/strategies/{id}", OperationKind.READ, "strategies", True, None),
    RouteDefinition("/strategies", OperationKind.LIST, "strategies", True, None),
    RouteDefinition("/strategies/{id}/actions", OperationKind.ACTION, "strategies", True, None),
)
