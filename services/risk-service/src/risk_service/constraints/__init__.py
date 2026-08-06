"""Risk Constraints — deterministic constraint value objects and management INTERFACE (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ConstraintSeverity(Enum):
    SOFT = "soft"   # a warning
    HARD = "hard"   # a hard constraint; breach blocks progression (RS-1)


@dataclass(frozen=True, slots=True)
class RiskConstraint:
    """A named, deterministic risk constraint; the evaluation is done by the deterministic engine.

    ``expression`` names the constraint (evaluated by an outer deterministic engine); no logic here.
    """

    name: str
    expression: str
    severity: ConstraintSeverity


class RiskConstraintService(Protocol):
    """Manages (versioned) risk constraints. Interface only; updates are governed."""

    def set_constraint(self, assessment: EntityId, constraint: RiskConstraint) -> None: ...
