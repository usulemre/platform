"""Event Model — the event taxonomy, lifecycle, metadata, and base event kinds (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_messaging.causation import CausationId
from platform_messaging.correlation import CorrelationId


class EventCategory(Enum):
    """The institutional event taxonomy (one category per bounded context, plus system/audit)."""

    RESEARCH = "research"
    DATASET = "dataset"
    EXPERIMENT = "experiment"
    FEATURE = "feature"
    SIGNAL = "signal"
    STRATEGY = "strategy"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    VALIDATION = "validation"
    EXECUTION = "execution"
    WORKFLOW = "workflow"
    GOVERNANCE = "governance"
    SYSTEM = "system"
    AUDIT = "audit"


class EventKind(Enum):
    DOMAIN = "domain"            # a fact within one bounded context
    INTEGRATION = "integration"  # a fact published across bounded contexts
    SYSTEM = "system"            # a platform/infrastructure lifecycle fact
    AUDIT = "audit"             # an audit-trail fact


class EventLifecycle(Enum):
    """The canonical event lifecycle."""

    CREATED = "created"
    VALIDATED = "validated"
    PUBLISHED = "published"
    DELIVERED = "delivered"
    CONSUMED = "consumed"
    ARCHIVED = "archived"
    # failure states
    REJECTED = "rejected"
    FAILED = "failed"
    EXPIRED = "expired"
    DEAD_LETTER = "dead_letter"


@dataclass(frozen=True, slots=True)
class EventMetadata:
    """Immutable classification + trace metadata carried by every messaging event."""

    category: EventCategory
    kind: EventKind
    lifecycle: EventLifecycle
    correlation_id: CorrelationId
    causation_id: CausationId | None
    occurred_at: str  # supplied ISO-8601 (CS-3)


@dataclass(frozen=True, slots=True)
class Event:
    """Messaging-layer base for a classified, lifecycle-aware, immutable event.

    Distinct from ``platform_contracts.common.Event`` (the payload contract): this base adds the
    messaging classification/lifecycle envelope used for transport and audit.
    """

    metadata: EventMetadata


class DomainEvent(Event):
    """A fact within a single bounded context."""

    __slots__ = ()


class IntegrationEvent(Event):
    """A fact published across bounded contexts."""

    __slots__ = ()


class SystemEvent(Event):
    """A platform/infrastructure lifecycle fact (not a domain fact)."""

    __slots__ = ()


class AuditEvent(Event):
    """An audit-trail fact (tamper-evident record; CP-7, SEC-4)."""

    __slots__ = ()
