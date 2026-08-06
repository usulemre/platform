"""Error Model — the canonical, vendor-neutral security error model (no provider details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SecurityErrorKind(Enum):
    UNREGISTERED_IDENTITY = "unregistered_identity"          # register-before-use
    AUTHENTICATION_FAILED = "authentication_failed"
    ACCESS_DENIED = "access_denied"                          # default-deny / least-privilege (SEC-2)
    PRIVILEGE_ESCALATION = "privilege_escalation"            # least-privilege violation
    AGENT_AUTHORITY_EXCEEDED = "agent_authority_exceeded"    # AI agent attempted decide/approve (AI-1..4)
    AI_AUTHORIZATION_ATTEMPT = "ai_authorization_attempt"    # an AI attempted an authz decision (AV2-25)
    HUMAN_OVERRIDE_BY_AI = "human_override_by_ai"            # AI attempted to override a human decision (HO-1, AI-4)
    IDENTITY_REVOKED = "identity_revoked"
    EXPIRED_CREDENTIAL = "expired_credential"


@dataclass(frozen=True, slots=True)
class SecurityError:
    """A canonical, vendor-neutral security error (no provider/vendor details leaked)."""

    kind: SecurityErrorKind
    message: str


class SecurityFrameworkError(Exception):
    """Base exception for the security foundation (framework faults, not provider errors)."""
