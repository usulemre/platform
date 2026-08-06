"""Audit Support — the security audit record and tamper-evident audit-trail INTERFACE (SEC-2/4)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class SecurityAuditRecord:
    """An immutable, hash-chained audit record of a security decision (access logging, SEC-2/4, CP-7)."""

    principal_ref: str
    action: str
    decision: str
    prev_hash: str
    entry_hash: str


class SecurityAuditTrail(Protocol):
    """Append-only, tamper-evident security audit trail. Interface only — no persistence.

    Every consequential access decision (esp. crown-jewel assets) is recorded with access logging (SEC-2).
    """

    def append(self, record: SecurityAuditRecord) -> None: ...
