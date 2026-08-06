"""Signal Metadata — the immutable, auditable metadata of a signal (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from signal_service.classification import SignalClassification
from signal_service.model import SignalIdentifier, SignalPriority
from signal_service.status import SignalStatus


@dataclass(frozen=True, slots=True)
class SignalMetadata:
    """Immutable metadata for a signal (auditable, provenance-bearing)."""

    identifier: SignalIdentifier
    description: str
    owner_role: str
    classification: SignalClassification
    status: SignalStatus
    priority: SignalPriority
    provenance: Provenance
    tags: tuple[str, ...]
