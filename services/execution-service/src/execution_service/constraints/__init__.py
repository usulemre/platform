"""Execution Constraints — deterministic execution-governance constraints (no routing/math here)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class ExecutionConstraintKind(Enum):
    PARTICIPATION = "participation"   # participation-rate ceiling (governance, not routing)
    VENUE = "venue"
    ORDER_SIZE = "order_size"
    RISK = "risk"                     # mandatory, sourced from the Risk Engine (RS-1)
    MANDATE = "mandate"


@dataclass(frozen=True, slots=True)
class ExecutionConstraint:
    """A deterministic execution constraint (evaluated by the deterministic engine; no routing/math)."""

    kind: ExecutionConstraintKind
    name: str
    expression: str
    source: Ref | None


class ExecutionConstraintService(Protocol):
    """Manages (versioned) execution constraints, incl. mandatory risk constraints. Interface only."""

    def add_constraint(self, execution: EntityId, constraint: ExecutionConstraint) -> None: ...
