"""Route Hierarchy — technology-independent route definitions (framework-agnostic; no HTTP verbs)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class OperationKind(Enum):
    """A framework-agnostic operation kind (NOT an HTTP verb; the concrete API maps these)."""

    CREATE = "create"
    READ = "read"
    LIST = "list"
    UPDATE = "update"
    ACTION = "action"
    DELETE = "delete"


@dataclass(frozen=True, slots=True)
class RouteDefinition:
    """An immutable, technology-independent route definition.

    ``workflow_ref`` names the Tier-5 workflow this route triggers for a consequential operation (the
    API never bypasses Workflow Contracts); ``requires_authorization`` is default-True (default-deny).
    """

    path_template: str
    operation: OperationKind
    resource_type: str
    requires_authorization: bool
    workflow_ref: str | None


@dataclass(frozen=True, slots=True)
class ApiRouteTree:
    """The immutable route hierarchy of the API (a set of route definitions)."""

    routes: tuple[RouteDefinition, ...]
