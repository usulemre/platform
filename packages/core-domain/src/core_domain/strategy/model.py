"""Strategy domain model — the strategy lifecycle, including a defined death (RL-2)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, Provenance, Ref, VersionedId

# --- Value Objects ---------------------------------------------------------


class StrategyLifecycle(Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    DEPLOYED = "deployed"
    RETIRED = "retired"


@dataclass(frozen=True, slots=True)
class CapitalEligibilityTokenRef:
    """Reference to the governance-issued capital-eligibility token (P2-09).

    The token aggregate itself lives in the governance context; strategy references it by id.
    """

    id: str


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Strategy(AggregateRoot):
    """A strategy (aggregate root); becomes capital-eligible only via the scientific gate."""

    strategy_id: VersionedId
    signal: Ref  # -> signal.Signal
    lifecycle: StrategyLifecycle
    eligibility: CapitalEligibilityTokenRef | None  # None until issued (RG-1)
    provenance: Provenance
