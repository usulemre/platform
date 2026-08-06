"""Domain Event Governance — the catalog of canonical domain events the bus transports (governance).

Only canonical, registered domain events are transported (register-before-publish). This catalog names
the canonical events by type, category, and owning bounded context.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.event_model import EventCategory


@dataclass(frozen=True, slots=True)
class CanonicalEventEntry:
    """An immutable catalog entry for a canonical domain event."""

    event_type: str
    category: EventCategory
    source_context: str


C = EventCategory

#: The canonical domain events the bus governs (register-before-publish). Names reference the events
#: defined in their bounded contexts; the bus transports only these (and other registered) domain events.
CANONICAL_EVENTS: tuple[CanonicalEventEntry, ...] = (
    CanonicalEventEntry("ResearchCreated", C.RESEARCH, "research"),
    CanonicalEventEntry("DatasetValidated", C.DATASET, "dataset"),
    CanonicalEventEntry("ExperimentRegistered", C.EXPERIMENT, "experiment"),
    CanonicalEventEntry("FeatureAccepted", C.FEATURE, "feature"),
    CanonicalEventEntry("BacktestCompleted", C.EXPERIMENT, "backtesting"),
    CanonicalEventEntry("RiskApproved", C.RISK, "risk"),
    CanonicalEventEntry("SignalGenerated", C.SIGNAL, "signal"),
    CanonicalEventEntry("PortfolioConstructed", C.PORTFOLIO, "portfolio"),
    CanonicalEventEntry("ExecutionAuthorized", C.EXECUTION, "execution"),
    CanonicalEventEntry("WorkflowCompleted", C.WORKFLOW, "workflow"),
)


class DomainEventGovernance(Protocol):
    """Governs which canonical domain events the bus transports (register-before-publish). Interface only."""

    def is_canonical(self, event_type: str) -> bool: ...
