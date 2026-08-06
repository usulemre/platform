"""Dataset event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class DatasetRegistered(Event):
    dataset_id: Id


@dataclass(frozen=True, slots=True)
class DatasetValidated(Event):
    """Canonical event: a dataset passed certification and is safe for research (DI-1)."""

    dataset_id: Id


@dataclass(frozen=True, slots=True)
class VintageRecorded(Event):
    dataset_id: Id
    vintage_id: Id
