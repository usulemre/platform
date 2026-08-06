"""Risk Metadata — the immutable, auditable metadata of a risk assessment (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from risk_service.classification import RiskClassification
from risk_service.model import RiskIdentifier
from risk_service.status import RiskStatus


@dataclass(frozen=True, slots=True)
class RiskMetadata:
    """Immutable metadata for a risk assessment (auditable, provenance-bearing)."""

    identifier: RiskIdentifier
    description: str
    owner_role: str  # independent risk owner (RS-2)
    classification: RiskClassification
    status: RiskStatus
    provenance: Provenance
    tags: tuple[str, ...]
