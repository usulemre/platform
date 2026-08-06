"""Authorization — the authorization request/result model and authorizer INTERFACE (deterministic).

An LLM MUST NEVER make an authorization decision (AV2-25, AIGOV-E-2); authorization is deterministic,
role/permission-based, and least-privilege.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class AuthorizationRequest:
    """An authorization request: a principal seeking an action on a resource, in a security context."""

    principal_ref: str
    resource: str
    action: str
    context_ref: str


@dataclass(frozen=True, slots=True)
class AuthorizationResult:
    """A deterministic, explainable authorization outcome (least-privilege; default-deny)."""

    granted: bool
    rationale: str


class Authorizer(Protocol):
    """Deterministically authorizes an action (role/permission-based, least-privilege). Interface only.

    An LLM MUST NEVER make an authorization decision (AV2-25); enforcement is deterministic.
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationResult: ...
