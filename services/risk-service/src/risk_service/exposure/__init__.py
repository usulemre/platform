"""Exposure Governance — exposure value objects and governance INTERFACE (no VaR computation here).

Exposure values are MEASURED by the deterministic numerical engine and referenced here; this module
governs exposures against limits. It performs NO VaR/stress computation.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class RiskExposure:
    """A measured exposure governed against a limit.

    ``measure`` names the exposure (e.g. gross/net/concentration); ``value`` is a value supplied by the
    deterministic numerical engine — it is NOT computed here (no VaR/stress algorithms).
    """

    measure: str
    value: float
    limit_name: str


class ExposureGovernanceService(Protocol):
    """Governs measured exposures against deterministic limits. Interface only.

    It references measured exposures and evaluates them against limits deterministically; it computes
    no VaR/stress. A hard breach blocks progression (RS-1).
    """

    def evaluate_exposure(self, assessment: EntityId) -> RiskExposure: ...
