"""datasets API — the datasets controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class DatasetController(Protocol):
    """API controller for datasets. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (no staged workflow), delegates to the datasets application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the datasets resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/datasets", OperationKind.CREATE, "datasets", True, None),
    RouteDefinition("/datasets/{id}", OperationKind.READ, "datasets", True, None),
    RouteDefinition("/datasets", OperationKind.LIST, "datasets", True, None),
    RouteDefinition("/datasets/{id}/actions", OperationKind.ACTION, "datasets", True, None),
)
