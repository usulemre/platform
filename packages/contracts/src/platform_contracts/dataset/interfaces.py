"""Dataset repository, as-of gateway, and certification contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    CertifyDataset,
    CertifyDatasetResponse,
    DatasetDto,
    ReadAsOf,
    ReadAsOfResponse,
)


class DatasetRepositoryContract(Protocol):
    def get(self, id: Id) -> DatasetDto: ...
    def add(self, dataset: DatasetDto) -> None: ...


class AsOfGatewayContract(Protocol):
    """The sole read path for history; a read without an as-of is impossible (PIT-1, AV2-22)."""

    def read_as_of(self, query: ReadAsOf) -> ReadAsOfResponse: ...


class CertificationServiceContract(Protocol):
    def certify(self, command: CertifyDataset) -> CertifyDatasetResponse: ...
