"""API Query — pagination, filtering, sorting, and search models (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True, slots=True)
class Pagination:
    """Immutable pagination parameters."""

    page: int
    page_size: int
    cursor: str | None


class SortDirection(Enum):
    ASC = "asc"
    DESC = "desc"


@dataclass(frozen=True, slots=True)
class Sorting:
    """An immutable sort specification."""

    field: str
    direction: SortDirection


@dataclass(frozen=True, slots=True)
class FilterCriterion:
    """An immutable filter criterion (field/operator/value)."""

    field: str
    operator: str
    value: str


@dataclass(frozen=True, slots=True)
class Filtering:
    """An immutable set of filter criteria."""

    criteria: tuple[FilterCriterion, ...]


@dataclass(frozen=True, slots=True)
class Search:
    """An immutable search request combining text, filtering, sorting, and pagination.

    Results are always access-filtered by authorization (never surface unauthorized data, SEC-2).
    """

    query: str
    filtering: Filtering | None
    sorting: tuple[Sorting, ...]
    pagination: Pagination
