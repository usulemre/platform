"""Limit Management — deterministic, versioned risk limits (reuses core_domain.risk.RiskLimit)."""
from __future__ import annotations

from typing import Protocol

from core_domain.risk import RiskLimit  # reuse the domain limit value object
from core_domain.shared import EntityId


class LimitManagementService(Protocol):
    """Manages deterministic, versioned risk limits (exposure/leverage/concentration/drawdown, RS-1).

    Limits are deterministic and formally testable; the deterministic RiskLimitEngine evaluates them.
    Interface only.
    """

    def set_limit(self, limit: RiskLimit) -> None: ...
    def get_limit(self, name: str) -> RiskLimit: ...
    def check(self, assessment: EntityId) -> bool: ...


__all__ = ["RiskLimit", "LimitManagementService"]
