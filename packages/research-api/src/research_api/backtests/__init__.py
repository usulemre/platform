"""backtests API — the backtests controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class BacktestController(Protocol):
    """API controller for backtests. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-45), delegates to the backtests application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the backtests resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/backtests", OperationKind.CREATE, "backtests", True, "WFC-45"),
    RouteDefinition("/backtests/{id}", OperationKind.READ, "backtests", True, None),
    RouteDefinition("/backtests", OperationKind.LIST, "backtests", True, None),
    RouteDefinition("/backtests/{id}/actions", OperationKind.ACTION, "backtests", True, "WFC-45"),
)
