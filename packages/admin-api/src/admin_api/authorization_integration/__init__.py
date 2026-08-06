"""Authorization Integration — the admin authorization INTERFACE (Auth & Authz; default-deny; mandatory)."""
from __future__ import annotations

from typing import Protocol

from platform_security.authorization import AuthorizationRequest, AuthorizationResult


class AdminAuthorizationGuard(Protocol):
    """Authorizes an admin request via the Auth & Authz Foundation before processing. Interface only.

    Administrative access is default-deny and least-privilege (SEC-2); deterministic and never
    AI-policed (AV2-25); a denied request is rejected fail-closed and audited.
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationResult: ...
