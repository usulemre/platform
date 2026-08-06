"""Signal Approval — approval model + INTERFACE requiring MANDATORY Risk approval (RS-1)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class SignalApproval:
    """Records that a signal cleared validation AND holds an approved Risk assessment (mandatory).

    A signal MUST NOT be ACTIVE without an approved Risk assessment (RS-1); no AI approves (AI-3).
    """

    validated: bool
    risk_approval_ref: Ref  # -> approved Risk assessment (risk_service)
    approver_role: str


class SignalApprovalService(Protocol):
    """Approves a signal for activation ONLY after validation AND a mandatory Risk approval. Interface only."""

    def approve(self, signal: EntityId) -> None: ...
    def reject(self, signal: EntityId, reason: str) -> None: ...
