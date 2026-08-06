"""Authentication Abstractions — vendor-neutral auth profile with secrets by reference (no auth logic).

Holds credential REFERENCES only; the credential VALUE is NEVER stored here or anywhere in the repo
(SEC-3, CODE-29, FB-14). No authentication logic — the concrete adapter/secrets broker performs auth.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AuthMethod(Enum):
    NONE = "none"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    MTLS = "mtls"
    TOKEN = "token"


@dataclass(frozen=True, slots=True)
class AuthSecretRef:
    """A reference to a credential held by the secrets broker; the value is NEVER stored (SEC-3)."""

    broker_path: str


@dataclass(frozen=True, slots=True)
class AuthenticationProfile:
    """A vendor-neutral authentication profile.

    It holds an auth method and a secret REFERENCE only; it contains no credentials and no auth logic.
    """

    method: AuthMethod
    secret_ref: AuthSecretRef | None
