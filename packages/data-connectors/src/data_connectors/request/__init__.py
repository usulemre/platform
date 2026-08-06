"""Request Model — the canonical, vendor-neutral data request (no provider-specific fields)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import CorrelationId


@dataclass(frozen=True, slots=True)
class TimeRange:
    """A supplied ISO-8601 time range for a historical request (no wall-clock read, CS-3)."""

    start: str
    end: str


@dataclass(frozen=True, slots=True)
class DataRequest:
    """A canonical, vendor-neutral data request.

    It contains NO provider-specific fields; the concrete adapter translates it. ``correlation_id``
    gives end-to-end traceability (CP-7).
    """

    symbols: tuple[str, ...]
    fields: tuple[str, ...]
    time_range: TimeRange | None
    correlation_id: CorrelationId
