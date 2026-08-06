"""Execution Session — an immutable record of an execution session (paper/shadow by default)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.execution import ExecutionMode
from core_domain.shared import EntityId, RunManifestRef

from execution_service.context import ExecutionContext


@dataclass(frozen=True, slots=True)
class ExecutionSession:
    """An immutable record binding an execution + context + manifest for a run (paper default, DEP-1)."""

    execution_id: EntityId
    mode: ExecutionMode
    manifest: RunManifestRef


class ExecutionSessionService(Protocol):
    """Opens/closes a deterministic execution session (paper/shadow by default). Interface only.

    A session produces/records a plan run; it never submits production orders or connects to brokers.
    """

    def open_session(self, execution: EntityId, context: ExecutionContext) -> ExecutionSession: ...
    def close_session(self, session: EntityId) -> None: ...
