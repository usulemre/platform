"""Signal domain model — the signal generation lifecycle (net-of-cost, isolation-respecting)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, VersionedId

# --- Value Objects ---------------------------------------------------------


class SignalLifecycle(Enum):
    DRAFT = "draft"
    REGISTERED = "registered"
    RETIRED = "retired"  # a signal has a defined death, not only a birth (RL-2)


@dataclass(frozen=True, slots=True)
class SignalSpec:
    """Declarative signal definition, net-of-cost from the first screen (AD-1)."""

    definition: str
    net_of_cost: bool


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Signal(AggregateRoot):
    """A versioned signal (aggregate root) derived from accepted features."""

    signal_id: VersionedId
    feature: Ref  # -> feature.Feature (cross-context reference by identity, SE-2)
    spec: SignalSpec
    lifecycle: SignalLifecycle
    provenance: Provenance
