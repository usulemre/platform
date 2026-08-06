"""Security Context — the immutable per-request security context (no credentials, SEC-3)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import ActorRef
from platform_contracts.common import CorrelationId


@dataclass(frozen=True, slots=True)
class SecurityContext:
    """Immutable security context for a request.

    It carries the authenticated principal and actor (with authority) and a correlation id for
    traceability; it carries NO credentials (SEC-3).
    """

    principal_ref: str
    actor: ActorRef
    correlation_id: CorrelationId
