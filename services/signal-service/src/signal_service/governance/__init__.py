"""Signal Governance — the deterministic governance-enforcement INTERFACE for signals (no logic).

Enforces: mandatory Risk approval before ACTIVE (RS-1), net-of-cost (AD-1), the isolation barrier
(AD-3), and no portfolio-construction / no execution authority (boundary). Enforcement is deterministic.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class SignalGovernanceService(Protocol):
    """Deterministically checks a signal's governance compliance. Interface only.

    Compliance requires: validated, mandatory Risk approval present, net-of-cost, isolation-compliant,
    and no portfolio/execution overreach.
    """

    def is_governance_compliant(self, signal: EntityId) -> bool: ...
    def requires_risk_approval(self, signal: EntityId) -> bool: ...
