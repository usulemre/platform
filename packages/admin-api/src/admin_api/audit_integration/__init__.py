"""Audit Integration — the admin audit-sink INTERFACE (complete, tamper-evident auditability; mandatory)."""
from __future__ import annotations

from typing import Protocol

from platform_security.audit import SecurityAuditRecord


class AdminAuditSink(Protocol):
    """Records every administrative operation in the tamper-evident audit trail. Interface only.

    Complete auditability is mandatory (CP-7, SEC-4): every consequential admin operation is recorded
    with who/what/when/why; overrides and counter-signs are recorded (HO-2).
    """

    def record(self, record: SecurityAuditRecord) -> None: ...
