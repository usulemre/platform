"""Research Ownership — the accountable owner value object and ownership-transfer interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ResearchOwner:
    """The accountable owner and steward roles for a research initiative (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


class ResearchOwnershipService(Protocol):
    """Transfers research ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, research: EntityId, to_role: str) -> None: ...
