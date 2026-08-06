"""Portfolio Approval — approval model + INTERFACE (independent risk review; human sign-off)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class PortfolioApproval:
    """Records that a portfolio cleared validation and independent risk review (RS-2).

    Capital-affecting approval requires human sign-off and counter-sign (HO-2); no AI approves (AI-3).
    """

    validated: bool
    risk_review_ref: Ref
    approver_role: str
    counter_signed: bool


class PortfolioApprovalService(Protocol):
    """Approves a portfolio for READY_FOR_EXECUTION after validation + independent risk review. Interface only."""

    def approve(self, portfolio: EntityId) -> None: ...
    def reject(self, portfolio: EntityId, reason: str) -> None: ...
