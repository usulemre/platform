"""Execution Metadata — the immutable, auditable metadata of an execution (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from execution_service.model import ExecutionIdentifier, ExecutionSummary
from execution_service.status import ExecutionStatus


@dataclass(frozen=True, slots=True)
class ExecutionMetadata:
    """Immutable metadata for an execution (auditable, provenance-bearing)."""

    identifier: ExecutionIdentifier
    description: str
    owner_role: str
    status: ExecutionStatus
    summary: ExecutionSummary
    provenance: Provenance
    tags: tuple[str, ...]
