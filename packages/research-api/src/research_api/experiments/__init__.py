"""experiments API — the experiments controller interface and route hierarchy (delegates to the application service)."""
from __future__ import annotations

from typing import Protocol

from research_api.core import ApiRequest, ApiResponse
from research_api.routing import OperationKind, RouteDefinition


class ExperimentController(Protocol):
    """API controller for experiments. Interface only — no endpoints, no HTTP, no business logic; stateless.

    It validates the request (Validation Foundation), authorizes it (Auth & Authz, default-deny),
    triggers approved workflows (Tier-5 workflow WFC-45), delegates to the experiments application service, publishes domain
    events, and returns canonical responses. It exposes no internal domain models.
    """

    def create(self, request: ApiRequest) -> ApiResponse: ...
    def get(self, request: ApiRequest) -> ApiResponse: ...
    def list(self, request: ApiRequest) -> ApiResponse: ...
    def action(self, request: ApiRequest) -> ApiResponse: ...


#: The route hierarchy for the experiments resource (technology-independent; consequential ops workflow-gated).
ROUTES: tuple[RouteDefinition, ...] = (
    RouteDefinition("/experiments", OperationKind.CREATE, "experiments", True, "WFC-45"),
    RouteDefinition("/experiments/{id}", OperationKind.READ, "experiments", True, None),
    RouteDefinition("/experiments", OperationKind.LIST, "experiments", True, None),
    RouteDefinition("/experiments/{id}/actions", OperationKind.ACTION, "experiments", True, "WFC-45"),
)
