"""Execution Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from execution_service.lifecycle import ExecutionLifecycle


@dataclass(frozen=True, slots=True)
class ExecutionStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ExecutionLifecycle
    since: str
