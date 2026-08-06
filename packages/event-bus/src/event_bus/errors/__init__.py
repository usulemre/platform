"""Error Model — the canonical, vendor-neutral Event Bus error model (no infrastructure details)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class EventBusErrorKind(Enum):
    UNREGISTERED_EVENT = "unregistered_event"                # register-before-publish (VER-1)
    SCHEMA_INCOMPATIBLE = "schema_incompatible"              # version compatibility (VER-2)
    NON_DOMAIN_EVENT = "non_domain_event"                    # transports canonical domain events only
    ISOLATION_BARRIER_VIOLATION = "isolation_barrier_violation"  # generation bound a restricted topic (P2-07)
    UNTRACEABLE = "untraceable"                              # missing correlation (CP-7)
    DELIVERY_FAILED = "delivery_failed"
    DEAD_LETTERED = "dead_lettered"


@dataclass(frozen=True, slots=True)
class EventBusError:
    """A canonical, vendor-neutral Event Bus error (no infrastructure/vendor details leaked)."""

    kind: EventBusErrorKind
    message: str


class EventBusFrameworkError(Exception):
    """Base exception for the Event Bus (framework faults, not broker errors)."""
