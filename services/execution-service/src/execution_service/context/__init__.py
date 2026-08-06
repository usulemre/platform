"""Execution Context — the immutable, deterministic execution context (injected clock; no infra)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.execution import ExecutionMode
from core_domain.shared import AsOf


@dataclass(frozen=True, slots=True)
class ExecutionContext:
    """Immutable context for an execution run.

    The SAME engine runs backtest/paper/live differing only by the injected clock and adapter (AV2-23):
    ``as_of`` is the injected point-in-time boundary; ``adapter_ref`` references the (out-of-scope)
    execution adapter, which the engine NEVER calls. Default mode is PAPER (DEP-1). No wall-clock, no infra.
    """

    as_of: AsOf
    mode: ExecutionMode
    adapter_ref: str
