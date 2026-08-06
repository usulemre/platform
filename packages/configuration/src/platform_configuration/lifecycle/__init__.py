"""Configuration Lifecycle — the canonical lifecycle states and legal transitions (data only)."""
from __future__ import annotations

from enum import Enum


class ConfigurationLifecycle(Enum):
    """The canonical configuration lifecycle."""

    DRAFT = "draft"
    VALIDATED = "validated"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    RETIRED = "retired"
    # failure states
    INVALID = "invalid"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


L = ConfigurationLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ConfigurationLifecycle, ConfigurationLifecycle], ...] = (
    (L.DRAFT, L.VALIDATED),
    (L.VALIDATED, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.DEPRECATED),
    (L.DEPRECATED, L.RETIRED),
    # failure / holding
    (L.DRAFT, L.INVALID),
    (L.VALIDATED, L.REJECTED),
    (L.APPROVED, L.REJECTED),
    (L.ACTIVE, L.SUSPENDED),
    (L.SUSPENDED, L.ACTIVE),
    (L.SUSPENDED, L.RETIRED),
)

#: Terminal states (no further transitions).
TERMINAL_STATES: frozenset[ConfigurationLifecycle] = frozenset({L.RETIRED, L.REJECTED, L.INVALID})
