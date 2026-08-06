"""Storage Lifecycle — the canonical lifecycle states, transitions, version, status, and service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import ContentHash, Id, SchemaVersion


class StorageLifecycle(Enum):
    """The canonical storage lifecycle."""

    REGISTERED = "registered"
    INITIALIZED = "initialized"
    AVAILABLE = "available"
    ACTIVE = "active"
    ARCHIVED = "archived"
    RETIRED = "retired"


L = StorageLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[StorageLifecycle, StorageLifecycle], ...] = (
    (L.REGISTERED, L.INITIALIZED),
    (L.INITIALIZED, L.AVAILABLE),
    (L.AVAILABLE, L.ACTIVE),
    (L.ACTIVE, L.ARCHIVED),
    (L.ARCHIVED, L.RETIRED),
    # recovery / restore from archive
    (L.ARCHIVED, L.ACTIVE),
    # graceful availability toggling
    (L.ACTIVE, L.AVAILABLE),
    (L.AVAILABLE, L.RETIRED),
)

#: Terminal state. Reproducibility-critical data is retained even when RETIRED-adjacent (RP-4, P5-01).
TERMINAL_STATES: frozenset[StorageLifecycle] = frozenset({L.RETIRED})


@dataclass(frozen=True, slots=True)
class StorageVersion:
    """An immutable, content-addressed storage version (CP-2; a change creates a new version)."""

    version: SchemaVersion
    content: ContentHash
    supersedes: str | None


@dataclass(frozen=True, slots=True)
class StorageStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: StorageLifecycle
    since: str


class StorageLifecycleService(Protocol):
    """Governs storage lifecycle transitions and supported operations. Interface only.

    Supports versioning, snapshots, archival, recovery, and migration; no infrastructure here.
    """

    def transition(self, item: Id, to: StorageLifecycle) -> None: ...
    def recover(self, item: Id) -> None: ...
    def migrate(self, item: Id, to_provider: Id) -> None: ...
