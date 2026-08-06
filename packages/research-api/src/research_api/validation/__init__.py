"""validation API — the validation controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class ValidationController(Protocol):
    """API controller for validation. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-46), delegates to the validation application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the validation resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/validation", OperationKind.CREATE, "validation", True, "WFC-46"),
    RouteDefinition("/validation/{id}", OperationKind.READ, "validation", True, None),
    RouteDefinition("/validation", OperationKind.LIST, "validation", True, None),
    RouteDefinition("/validation/{id}/actions", OperationKind.ACTION, "validation", True, "WFC-46"),
)
