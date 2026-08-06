"""Rate Limit Policy — provider rate limiting as immutable policy data (no logic)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RateLimitPolicy:
    """Declarative rate-limit configuration for a connector (applied by the concrete adapter)."""

    max_requests: int
    per_seconds: int
    burst: int
