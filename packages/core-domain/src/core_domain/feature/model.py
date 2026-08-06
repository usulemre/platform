"""Feature domain model — declarative, PIT-bound, leakage-clean, provenance-bearing features."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, VersionedId

# --- Value Objects ---------------------------------------------------------


class AcceptanceStatus(Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class FeatureSpec:
    """A declarative feature definition computed only through the as-of path (FA-1, PIT-3)."""

    definition: str


@dataclass(frozen=True, slots=True)
class LeakageReport:
    """Outcome of the Leakage Harness; must pass before acceptance (FA-2, P2-03)."""

    clean: bool
    summary: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Feature(AggregateRoot):
    """A versioned feature (aggregate root); accepted only when leakage-clean and provenanced."""

    feature_id: VersionedId
    spec: FeatureSpec
    status: AcceptanceStatus
    provenance: Provenance
