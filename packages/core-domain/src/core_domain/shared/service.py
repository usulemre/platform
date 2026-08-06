"""Domain service marker — a stateless domain-service interface (behavior lives in outer engines)."""
from __future__ import annotations

from typing import Protocol


class DomainService(Protocol):
    """Marker interface for a domain service."""

    ...
