"""Experiment Ownership — the accountable owner value object and ownership-transfer interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ExperimentOwner:
    """The accountable owner and steward roles for an experiment (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


class ExperimentOwnershipService(Protocol):
    """Transfers experiment ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, experiment: EntityId, to_role: str) -> None: ...
