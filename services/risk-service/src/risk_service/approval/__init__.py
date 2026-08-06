"""Risk Approval — the independent risk sign-off INTERFACE (follows the deterministic verdict)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RiskApprovalService(Protocol):
    """Records the independent risk sign-off at promotion (RS-2). Interface only.

    Approval follows the deterministic verdict and independent review; no AI approves (AI-3); an
    override MUST NOT be used to bypass statistical/risk enforcement (HO-3).
    """

    def approve(self, assessment: EntityId) -> None: ...
    def reject(self, assessment: EntityId, reason: str) -> None: ...
