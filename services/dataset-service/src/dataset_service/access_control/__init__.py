"""Dataset Access Control — least-privilege, need-to-know access policy and control INTERFACE."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import DatasetIdentifier


class AccessLevel(Enum):
    NONE = "none"
    READ = "read"
    STEWARD = "steward"
    OWNER = "owner"


@dataclass(frozen=True, slots=True)
class DatasetAccessPolicy:
    """Least-privilege access policy for a dataset.

    Crown-jewel (factor/alpha-adjacent) datasets are need-to-know with access logging (SEC-2).
    """

    dataset: DatasetIdentifier
    minimum_level: AccessLevel
    need_to_know: bool


class AccessControl(Protocol):
    """Deterministically decides whether a principal may access a dataset at a level. Interface only.

    Access is default-deny; enforcement is deterministic, never AI-policed (AV2-25).
    """

    def is_allowed(self, principal: str, dataset: EntityId, level: AccessLevel) -> bool: ...
