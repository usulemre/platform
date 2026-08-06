"""Execution Monitoring Interfaces — surface execution metrics for independent monitoring (narrate only).

Surfaces fills/parity/TCA references for independent monitoring; it narrates and decides nothing. The
kill-switch (human/risk) can force HALT (RS-3). No infra.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.execution import Fill, ParityReport
from core_domain.shared import EntityId


class ExecutionMonitor(Protocol):
    """Surfaces execution status/metrics for independent monitoring. Interface only — narrates only.

    It reports fills/parity/status references; it never decides a halt (the risk engine/human does, RS-3).
    """

    def status(self, execution: EntityId) -> str: ...
    def latest_fill(self, execution: EntityId) -> Fill: ...
    def parity(self, execution: EntityId) -> ParityReport: ...
