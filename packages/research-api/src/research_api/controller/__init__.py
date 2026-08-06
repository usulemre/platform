"""Controller — the base controller marker and the canonical API pipeline INTERFACE.

A controller delegates to an application service; it validates, authorizes, triggers approved
workflows, publishes domain events, and returns canonical responses. It exposes no domain models,
contains no business logic, and is stateless.
"""
from __future__ import annotations

from typing import Protocol


class Controller(Protocol):
    """Marker base for API controllers. Interface only — no endpoints, no HTTP, no business logic, stateless."""

    ...


class ApiPipeline(Protocol):
    """The canonical API request pipeline. Interface only.

    Every consequential operation flows: validate (Validation Foundation) -> authorize (Auth & Authz,
    default-deny) -> trigger approved workflow (Workflow Contracts) -> delegate to the application
    service -> publish domain event -> return canonical response. No stage may be bypassed.
    """

    def process(self, request_ref: str) -> str: ...
