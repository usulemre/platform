"""Dataset Metadata — the immutable, auditable metadata of a dataset (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from dataset_service.model import (
    DatasetClassification,
    DatasetIdentifier,
    DatasetOwnership,
    DatasetStatus,
)


@dataclass(frozen=True, slots=True)
class DatasetMetadata:
    """Immutable catalog metadata for a dataset (auditable, provenance-bearing)."""

    identifier: DatasetIdentifier
    description: str
    classification: DatasetClassification
    ownership: DatasetOwnership
    status: DatasetStatus
    provenance: Provenance
    tags: tuple[str, ...]
