"""Connector Configuration — the vendor-neutral connection profile (secrets by reference; no vendor fields)."""
from __future__ import annotations

from dataclasses import dataclass

from data_connectors.rate_limit import RateLimitPolicy
from data_connectors.retry import RetryPolicy


@dataclass(frozen=True, slots=True)
class ConnectionProfile:
    """A vendor-neutral connection configuration.

    ``endpoint_ref`` is a logical endpoint reference (not a URL/host); ``parameters`` are non-secret
    label pairs; secrets are carried by reference in the AuthenticationProfile (SEC-3). No vendor fields.
    """

    endpoint_ref: str
    parameters: tuple[tuple[str, str], ...]
    retry_policy: RetryPolicy
    rate_limit_policy: RateLimitPolicy
