"""Scheduler Metadata — the immutable, auditable metadata of a scheduled job (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_scheduler.core import JobCategory, ScheduleIdentifier
from platform_scheduler.lifecycle import JobStatus


@dataclass(frozen=True, slots=True)
class SchedulerMetadata:
    """Immutable metadata for a scheduled job (auditable)."""

    identifier: ScheduleIdentifier
    category: JobCategory
    owner_role: str
    status: JobStatus
    tags: tuple[str, ...]
