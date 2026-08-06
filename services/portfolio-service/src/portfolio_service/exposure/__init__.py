"""Exposure Management — the exposure model and governance INTERFACE (no computation here).

Exposure values are MEASURED by the deterministic engine and referenced here; this module governs
exposures against constraints. No allocation/exposure mathematics.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class PortfolioExposure:
    """A measured portfolio exposure governed against a constraint (value supplied by the engine)."""

    measure: str
    value: float
    constraint_name: str


class ExposureManagementService(Protocol):
    """Governs measured exposures against deterministic constraints. Interface only — no computation."""

    def exposures_of(self, portfolio: EntityId) -> tuple[PortfolioExposure, ...]: ...
