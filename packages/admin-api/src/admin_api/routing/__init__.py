"""Admin Route Hierarchy — technology-independent admin route definitions (framework-agnostic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class OperationKind(Enum):
    """A framework-agnostic administrative operation kind (NOT an HTTP verb)."""

    GET = "get"
    LIST = "list"
    ADMINISTER = "administer"  # a control-changing administrative action
    APPROVE = "approve"
    REVOKE = "revoke"


@dataclass(frozen=True, slots=True)
class RouteDefinition:
    """An immutable, technology-independent administrative route definition.

    ``requires_authorization`` is default-True (default-deny); ``requires_counter_sign`` is True for
    control-changing / capital-affecting operations (HO-2); ``workflow_ref`` names the Tier-5 workflow
    a consequential operation triggers (never bypass Workflow Contracts).
    """

    path_template: str
    operation: OperationKind
    resource_type: str
    requires_authorization: bool
    requires_counter_sign: bool
    workflow_ref: str | None


@dataclass(frozen=True, slots=True)
class AdminRouteTree:
    """The immutable administrative route hierarchy (a set of route definitions)."""

    routes: tuple[RouteDefinition, ...]
