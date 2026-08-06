"""Storage Core — the canonical storage identity, profile, context, classes, and provider port."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import CorrelationId, SchemaVersion


class StorageClass(Enum):
    """Storage tier (lifecycle-governed; no 'immutable forever, hot forever', SC-2)."""

    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    ARCHIVE = "archive"


class StorageKind(Enum):
    """The kind of stored thing (drives which store abstraction applies)."""

    OBJECT = "object"
    DATASET = "dataset"
    ARTIFACT = "artifact"
    METADATA = "metadata"
    SNAPSHOT = "snapshot"


@dataclass(frozen=True, slots=True)
class StorageIdentifier:
    """A stable, versioned identity for a stored item (NM-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class StorageProfile:
    """A vendor-neutral storage configuration.

    ``immutable`` marks immutable research artifacts (CP-2); ``worm`` marks write-once-read-many for
    tamper-evidence (SEC-4); ``storage_class`` drives lifecycle tiering (SC-2). No vendor fields.
    """

    storage_class: StorageClass
    immutable: bool
    worm: bool
    encrypted: bool


@dataclass(frozen=True, slots=True)
class StorageContext:
    """Immutable context for a storage operation.

    ``as_of`` is a supplied point-in-time boundary for historical reads (PIT-1); no wall-clock (CS-3).
    """

    correlation_id: CorrelationId
    as_of: str | None


class StorageProviderPort(Protocol):
    """A vendor-neutral storage provider port. Interface only — no database/object-store/client here."""

    def initialize(self) -> None: ...
    def health(self) -> str: ...
