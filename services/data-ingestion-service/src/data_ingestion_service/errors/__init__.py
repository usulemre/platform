"""Ingestion errors. Per-record faults are QUARANTINED (returned as data, DI-2), never raised; the
pipeline raises only when its own configuration is structurally invalid (fail closed)."""
from __future__ import annotations

from core_domain.shared import DomainError


class IngestionError(DomainError):
    """Base for data-ingestion errors."""


class IngestionConfigError(IngestionError):
    """The ingestion configuration is structurally invalid (bad precision, empty dataset name)."""


__all__ = ["IngestionConfigError", "IngestionError"]
