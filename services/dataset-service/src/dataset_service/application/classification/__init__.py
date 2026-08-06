"""Dataset Classification — the classification application service (drives access control)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import DatasetClassification


class DatasetClassificationService(Protocol):
    """Assigns/updates a dataset's classification. Interface only.

    Classification drives access control (a more sensitive classification tightens access, SEC-2).
    """

    def classify(self, dataset: EntityId, classification: DatasetClassification) -> None: ...
