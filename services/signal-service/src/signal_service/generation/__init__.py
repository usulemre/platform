"""Signal Generation — the deterministic generation coordination INTERFACE (no algorithm here).

Coordinates standardizing a validated research output into a signal via the deterministic engine. It
runs NO generation algorithm, is net-of-cost (AD-1), and never observes per-candidate validation/OOS
outcomes (isolation barrier, AD-3, P2-07).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.decision import SignalDecision


class SignalGenerationService(Protocol):
    """Coordinates deterministic signal generation from validated evidence. Interface only.

    It yields a deterministic decision to generate (or reject); it runs no algorithm and no ML, is
    net-of-cost, and does not observe validation/OOS outcomes.
    """

    def generate(self, subject: EntityId) -> SignalDecision: ...
