"""Research Metadata — the immutable, auditable metadata of a research initiative (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from research_service.classification import ResearchClassification
from research_service.model import ResearchIdentifier, ResearchPriority
from research_service.ownership import ResearchOwner
from research_service.status import ResearchStatus


@dataclass(frozen=True, slots=True)
class ResearchMetadata:
    """Immutable metadata for a research initiative (auditable, provenance-bearing)."""

    identifier: ResearchIdentifier
    description: str
    classification: ResearchClassification
    owner: ResearchOwner
    status: ResearchStatus
    priority: ResearchPriority
    provenance: Provenance
    tags: tuple[str, ...]
