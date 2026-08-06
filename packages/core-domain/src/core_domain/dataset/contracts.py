"""Dataset repository, As-Of read port, and certification-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import AsOf, EntityId

from .model import Dataset, DataQualityReport, Vintage


class DatasetRepository(Protocol):
    """Append-only repository of certified dataset versions (immutable, CP-2)."""

    def get(self, id: EntityId) -> Dataset: ...
    def add(self, dataset: Dataset) -> None: ...


class VintageRepository(Protocol):
    """Append-only vintage store; a vintage is never overwritten (DI-3)."""

    def get(self, id: EntityId) -> Vintage: ...
    def add(self, vintage: Vintage) -> None: ...


class AsOfGateway(Protocol):
    """The sole read path for history; a read without an ``AsOf`` is impossible (PIT-1, AV2-22)."""

    def read_as_of(self, dataset: EntityId, as_of: AsOf) -> Dataset: ...


class CertificationService(Protocol):
    """Interface: certifies a dataset version. Deterministic engine implements it, not the domain."""

    def certify(self, dataset: EntityId) -> DataQualityReport: ...
