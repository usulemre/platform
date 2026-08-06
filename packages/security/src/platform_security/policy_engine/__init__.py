"""Policy Engine — the security policy model and deterministic policy-evaluation INTERFACE (OPA-style).

Security policies are deterministic, versioned, and golden-testable code (RBAC/ABAC); no AI evaluates
policy (AV2-25, DE-1). The concrete engine (Open Policy Agent, per TDR) plugs in behind the interface.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import SchemaVersion

from platform_security.authorization import AuthorizationRequest, AuthorizationResult


@dataclass(frozen=True, slots=True)
class SecurityPolicy:
    """A named, versioned, deterministic authorization policy (RBAC/ABAC). Immutable; a change is a new version."""

    name: str
    version: SchemaVersion
    description: str


class PolicyEngine(Protocol):
    """Evaluates security policies deterministically. Interface only.

    Policies are versioned, golden-testable code; the evaluation is deterministic and never performed
    by an AI (AV2-25, DE-1).
    """

    def evaluate(self, request: AuthorizationRequest) -> AuthorizationResult: ...
