"""Dataset contracts — Commands, Queries (as-of), Requests, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response

# --- DTOs ------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class DatasetDto(Dto):
    id: Id
    certified: bool


@dataclass(frozen=True, slots=True)
class DataQualityReportDto(Dto):
    passed: bool
    summary: str


# --- Commands --------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterDataset(Command):
    name: str


@dataclass(frozen=True, slots=True)
class CertifyDataset(Command):
    dataset_id: Id


@dataclass(frozen=True, slots=True)
class RecordVintage(Command):
    """Record a restatement as a NEW vintage; overwrites are PROHIBITED (DI-3)."""

    dataset_id: Id


# --- Queries ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ReadAsOf(Query):
    """A point-in-time read; the as-of is mandatory (PIT-1, fail-closed)."""

    dataset_id: Id
    as_of: str  # ISO-8601 knowledge-time boundary


# --- Responses -------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class CertifyDatasetResponse(Response):
    report: DataQualityReportDto


@dataclass(frozen=True, slots=True)
class ReadAsOfResponse(Response):
    dataset: DatasetDto
