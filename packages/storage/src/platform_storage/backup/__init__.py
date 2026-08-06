"""Backup Abstractions — the backup policy model and backup-service INTERFACE (DR/BCP; no infra).

Supports tested RPO/RTO for disaster recovery / business continuity (P6-03, RE-3). No infrastructure here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class BackupPolicy:
    """A backup policy with target RPO/RTO (tested before any live capital, P6-03)."""

    rpo_seconds: int
    rto_seconds: int
    frequency: str


class BackupService(Protocol):
    """Backup/restore abstraction for disaster recovery. Interface only — no infrastructure.

    Backups are immutable and verifiable; restore supports recovery to the target RPO/RTO.
    """

    def backup(self, item: Id) -> None: ...
    def restore(self, item: Id) -> None: ...
