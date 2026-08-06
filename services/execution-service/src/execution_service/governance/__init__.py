"""Execution Governance — the deterministic execution-governance enforcement INTERFACE (no logic).

Enforces: paper-first (DEP-1), token-gated live (RS-4), plans-only, reversibility (DEP-3), no broker/
exchange/order submission, and the kill-switch (RS-3). Enforcement is deterministic.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExecutionGovernanceService(Protocol):
    """Deterministically checks an execution's governance compliance. Interface only.

    Compliance requires: validated, parity-clean, risk-authorized, a valid token for LIVE, reversible,
    and no broker/exchange/order-submission overreach.
    """

    def is_governance_compliant(self, execution: EntityId) -> bool: ...
    def requires_authorization_token(self, execution: EntityId) -> bool: ...
