"""Controller — the base admin controller marker and the canonical admin pipeline INTERFACE.

A controller delegates to an administrative application service; it validates, authorizes, enforces
governance (approval + counter-sign), triggers approved workflows, records a complete audit trail,
publishes administrative events, and returns canonical responses. It exposes no domain models, contains
no business logic, and is stateless.
"""
from __future__ import annotations

from typing import Protocol


class Controller(Protocol):
    """Marker base for admin controllers. Interface only — no endpoints, no HTTP, no business logic, stateless."""

    ...


class AdminPipeline(Protocol):
    """The canonical admin request pipeline. Interface only.

    Every administrative operation flows: validate -> authenticate + authorize (default-deny) ->
    enforce governance (approval + counter-sign for control-changes, HO-2/3) -> trigger approved
    workflow -> delegate to the administrative application service -> record complete audit -> publish
    administrative event -> return canonical response. No stage may be bypassed.
    """

    def process(self, request_ref: str) -> str: ...
