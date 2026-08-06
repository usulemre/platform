"""Feature Metadata — the immutable, auditable metadata of a feature (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from feature_service.classification import FeatureClassification
from feature_service.model import FeatureIdentifier
from feature_service.ownership import FeatureOwner
from feature_service.status import FeatureStatus


@dataclass(frozen=True, slots=True)
class FeatureMetadata:
    """Immutable metadata for a feature (auditable, provenance-bearing)."""

    identifier: FeatureIdentifier
    description: str
    classification: FeatureClassification
    owner: FeatureOwner
    status: FeatureStatus
    provenance: Provenance
    tags: tuple[str, ...]
