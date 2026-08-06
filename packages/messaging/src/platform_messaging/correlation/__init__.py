"""Correlation Context — groups all messages of one logical flow for end-to-end traceability."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import CorrelationId  # re-exported (single source of truth)


@dataclass(frozen=True, slots=True)
class CorrelationContext:
    """Carries the correlation id that ties every message in one logical flow together (CP-7)."""

    correlation_id: CorrelationId


__all__ = ["CorrelationId", "CorrelationContext"]
