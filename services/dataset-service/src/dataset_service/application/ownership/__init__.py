"""Dataset Ownership — the ownership-transfer application service (recorded accountability)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class DatasetOwnershipService(Protocol):
    """Transfers dataset ownership with recorded accountability (CP-7, HO-1). Interface only."""

    def transfer(self, dataset: EntityId, to_role: str) -> None: ...
