"""Dataset Service Interfaces — the Data Platform application service (orchestration; no adjudication).

These interfaces orchestrate registration -> certification/validation -> publication via deterministic
gates; they perform NO adjudication, NO ingestion, NO storage, NO persistence, NO API. Interfaces only.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.metadata import DatasetMetadata
from dataset_service.model import Dataset


class DatasetService(Protocol):
    """The Data Platform application service (interface only).

    Publication requires a passed deterministic certification/validation gate (DI-1); the service
    never certifies data itself and never lets AI decide.
    """

    def register(self, dataset: Dataset) -> None: ...
    def submit_for_validation(self, dataset: EntityId) -> None: ...
    def publish(self, dataset: EntityId) -> None: ...
    def deprecate(self, dataset: EntityId) -> None: ...
    def archive(self, dataset: EntityId) -> None: ...


class DatasetCatalogService(Protocol):
    """Describes datasets from the catalog. Interface only."""

    def describe(self, dataset: EntityId) -> DatasetMetadata: ...


class DatasetOwnershipService(Protocol):
    """Transfers dataset ownership with recorded accountability (CP-7). Interface only."""

    def transfer_ownership(self, dataset: EntityId, to_role: str) -> None: ...
