"""Experiment Metadata — the immutable, auditable metadata of an experiment (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from experiment_service.classification import ExperimentClassification
from experiment_service.model import ExperimentIdentifier
from experiment_service.ownership import ExperimentOwner
from experiment_service.status import ExperimentStatus


@dataclass(frozen=True, slots=True)
class ExperimentMetadata:
    """Immutable metadata for an experiment (auditable, provenance-bearing)."""

    identifier: ExperimentIdentifier
    description: str
    classification: ExperimentClassification
    owner: ExperimentOwner
    status: ExperimentStatus
    provenance: Provenance
    tags: tuple[str, ...]
