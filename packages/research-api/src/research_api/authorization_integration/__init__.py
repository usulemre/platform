"""Authorization Integration — the API authorization INTERFACE (Auth & Authz; default-deny; mandatory).

The API MUST NOT bypass Authentication & Authorization. Authorization is deterministic and default-deny;
an LLM MUST NEVER authorize (AV2-25).
"""
from __future__ import annotations

from typing import Protocol

from platform_security.authorization import AuthorizationRequest, AuthorizationResult


class ApiAuthorizationGuard(Protocol):
    """Authorizes an API request via the Auth & Authz Foundation before processing. Interface only.

    Default-deny and least-privilege (SEC-2); deterministic and never AI-policed (AV2-25); a denied
    request is rejected fail-closed and audited.
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationResult: ...
