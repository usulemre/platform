"""Error Model — the canonical, vendor-neutral connector error model (no provider details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ConnectorErrorKind(Enum):
    AUTH_FAILURE = "auth_failure"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    INVALID_REQUEST = "invalid_request"
    QUARANTINE_REQUIRED = "quarantine_required"  # bad data must be quarantined, never repaired (DI-2)
    VENDOR_LEAK = "vendor_leak"                   # a provider-specific model/detail was exposed (boundary)


@dataclass(frozen=True, slots=True)
class ConnectorError:
    """A canonical, vendor-neutral connector error (no provider-specific details leaked, boundary)."""

    kind: ConnectorErrorKind
    message: str


class ConnectorFrameworkError(Exception):
    """Base exception for the connectors framework (framework faults, not provider errors)."""
