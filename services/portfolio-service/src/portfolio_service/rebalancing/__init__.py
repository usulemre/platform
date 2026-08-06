"""Rebalancing Coordination — coordinates governed rebalancing/reconstruction (no math here).

A rebalance produces a NEW versioned portfolio candidate that re-enters validation; it never mutates
an approved snapshot (RL-1, PS-4). No allocation mathematics here.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RebalancingCoordinator(Protocol):
    """Coordinates governed rebalancing/reconstruction of a portfolio. Interface only.

    It produces a new versioned candidate (turnover-aware, net-of-cost) that re-validates; it computes
    no allocation mathematics and never edits an approved snapshot.
    """

    def request_rebalance(self, portfolio: EntityId) -> EntityId: ...
