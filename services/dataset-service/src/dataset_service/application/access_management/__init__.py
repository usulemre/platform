"""Dataset Access Management — access coordination (default-deny, need-to-know)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.access_control import AccessLevel


class DatasetAccessManagementService(Protocol):
    """Coordinates dataset access decisions. Interface only.

    Default-deny and need-to-know; crown-jewel datasets restricted with access logging (SEC-2).
    Enforcement is deterministic, never AI-policed (AV2-25).
    """

    def grant(self, principal: str, dataset: EntityId, level: AccessLevel) -> None: ...
    def revoke(self, principal: str, dataset: EntityId) -> None: ...
    def check(self, principal: str, dataset: EntityId, level: AccessLevel) -> bool: ...
