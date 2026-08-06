"""signals API — the signals controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class SignalController(Protocol):
    """API controller for signals. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (no staged workflow), delegates to the signals application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the signals resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/signals", OperationKind.CREATE, "signals", True, None),
    RouteDefinition("/signals/{id}", OperationKind.READ, "signals", True, None),
    RouteDefinition("/signals", OperationKind.LIST, "signals", True, None),
    RouteDefinition("/signals/{id}/actions", OperationKind.ACTION, "signals", True, None),
)
