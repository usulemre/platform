"""Risk Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from risk_service.lifecycle import RiskLifecycle


@dataclass(frozen=True, slots=True)
class RiskStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: RiskLifecycle
    since: str
