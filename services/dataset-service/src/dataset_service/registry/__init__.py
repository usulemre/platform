"""Dataset Registry — the append-only, register-before-use registry INTERFACE (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lifecycle import DatasetLifecycle
from dataset_service.model import Dataset


@dataclass(frozen=True, slots=True)
class DatasetRecord:
    """An immutable registry record of a dataset's existence and current lifecycle state."""

    dataset_id: EntityId
    state: DatasetLifecycle


class DatasetRegistry(Protocol):
    """Append-only, register-before-use registry of datasets. Interface only — no persistence.

    Registration is a governed transition; no dataset is served before it is registered (DP-1).
    """

    def get(self, dataset: EntityId) -> DatasetRecord: ...
    def register(self, dataset: Dataset) -> None: ...
