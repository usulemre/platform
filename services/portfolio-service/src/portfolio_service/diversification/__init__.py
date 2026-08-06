"""Diversification Governance — the diversification governance INTERFACE (no computation here).

Governs concentration/diversification against constraints deterministically; the numerical measures
are supplied by the deterministic engine. No allocation mathematics.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class DiversificationGovernanceService(Protocol):
    """Governs a portfolio's diversification/concentration against constraints. Interface only.

    It references measured concentration values and evaluates them against constraints deterministically;
    it computes no diversification mathematics. A hard breach blocks approval (PS-2).
    """

    def is_within_diversification_limits(self, portfolio: EntityId) -> bool: ...
