"""Health Monitoring — the health status model and monitor INTERFACE (narrate only; no infra)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class HealthState(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass(frozen=True, slots=True)
class HealthStatus:
    """An immutable connector health status (``checked_at`` is a supplied ISO-8601 time, CS-3)."""

    state: HealthState
    checked_at: str
    detail: str


class HealthMonitor(Protocol):
    """Surfaces connector health for monitoring. Interface only — narrates; decides no halt.

    The concrete health check plugs in behind this interface; no infrastructure here.
    """

    def check(self, connector: Id) -> HealthStatus: ...
