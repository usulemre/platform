"""Execution Planning — the execution plan/instruction model and planning INTERFACE (plans only).

Transforms an approved portfolio into a deterministic execution PLAN. Instructions are PLAN elements,
NOT orders; the engine never routes or submits them and never connects to brokers/exchanges.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.execution import ExecutionMode
from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class ExecutionInstruction:
    """A single deterministic execution-plan instruction (a planned target delta; NOT an order).

    ``algo_ref`` references a deterministic execution algorithm (not the algorithm); no routing here.
    """

    instrument_ref: Ref
    target_delta: float
    algo_ref: str


@dataclass(frozen=True, slots=True)
class ExecutionPlan:
    """An immutable, deterministic execution PLAN derived from an approved portfolio (plans only).

    A plan is never submitted as production orders; it is paper-first (DEP-1) and reversible (DEP-3).
    """

    portfolio_ref: Ref  # -> portfolio_service approved portfolio (PS-1)
    instructions: tuple[ExecutionInstruction, ...]
    mode: ExecutionMode


class ExecutionPlanningService(Protocol):
    """Transforms an approved portfolio into a deterministic execution plan. Interface only.

    It produces plans only; it never routes/submits orders and never connects to brokers/exchanges.
    """

    def plan(self, execution: EntityId) -> ExecutionPlan: ...
