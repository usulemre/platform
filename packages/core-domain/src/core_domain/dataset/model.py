"""Dataset domain model — certified, point-in-time, provenance-bearing data (definitions only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import (
    AggregateRoot,
    BitemporalStamp,
    Provenance,
    VersionedId,
)

# --- Value Objects ---------------------------------------------------------


class CertificationStatus(Enum):
    UNCERTIFIED = "uncertified"
    CERTIFIED = "certified"
    QUARANTINED = "quarantined"  # bad data is quarantined, never silently repaired (DI-2)


@dataclass(frozen=True, slots=True)
class DataQualityReport:
    """Outcome of the certification/quality gate (descriptive)."""

    passed: bool
    summary: str


@dataclass(frozen=True, slots=True)
class Symbology:
    """As-of symbology mapping (reference data queried as-of, PIT-2)."""

    scheme: str


@dataclass(frozen=True, slots=True)
class UniverseSnapshot:
    """A survivorship-safe, as-of universe membership snapshot (PIT-2)."""

    as_of_label: str
    survivorship_safe: bool


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Vintage(AggregateRoot):
    """A restatement recorded as a NEW vintage; vintages are never overwritten (DI-3)."""

    stamp: BitemporalStamp
    provenance: Provenance


@dataclass(eq=False)
class Dataset(AggregateRoot):
    """A certified dataset version (aggregate root); immutable and versioned (CP-2)."""

    dataset_id: VersionedId
    certification: CertificationStatus
    provenance: Provenance
