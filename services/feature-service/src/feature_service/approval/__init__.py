"""Feature Approval — the approval INTERFACE (approval follows deterministic validation, not AI)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class FeatureApprovalService(Protocol):
    """Approves a feature for activation AFTER the deterministic Leakage Harness + validation gate pass.

    Approval records a deterministic-gate outcome (and, where required, a human sign-off, HO-2); it
    never adjudicates significance and no AI approves (AI-3). Interface only.
    """

    def approve(self, feature: EntityId) -> None: ...
    def reject(self, feature: EntityId, reason: str) -> None: ...
