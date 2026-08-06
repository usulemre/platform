"""Authentication — the authentication request/result model and authenticator INTERFACE (no protocol).

Carries a credential REFERENCE (assertion/secret ref), never a password/JWT (SEC-3). No OAuth/JWT/SSO
protocol here — the concrete IdP (Keycloak/OIDC) plugs in behind the interface.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol


class AuthMethod(Enum):
    NONE = "none"
    CREDENTIAL_REF = "credential_ref"  # a reference to a credential/assertion (never inlined)
    MTLS = "mtls"
    OIDC = "oidc"
    WORKLOAD = "workload"              # workload identity (SPIFFE)


@dataclass(frozen=True, slots=True)
class AuthenticationRequest:
    """An authentication request. ``credential_ref`` is a reference only; no password/JWT (SEC-3)."""

    identity_ref: str
    method: AuthMethod
    credential_ref: str


@dataclass(frozen=True, slots=True)
class AuthenticationResult:
    """The immutable outcome of authentication (no token bytes; a session reference only)."""

    authenticated: bool
    session_ref: str | None
    rationale: str


class Authenticator(Protocol):
    """Authenticates an identity. Interface only — no OAuth/JWT/SSO/protocol here.

    The concrete identity provider (Keycloak/OIDC, per TDR) plugs in behind this interface.
    """

    def authenticate(self, request: AuthenticationRequest) -> AuthenticationResult: ...
