"""Constraint Management — investment/risk constraint model and management INTERFACE (no math).

Constraints are deterministic and include the MANDATORY risk constraints sourced from the Risk Engine
(RS-1). Evaluation is done by the deterministic engine; no allocation mathematics here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class ConstraintKind(Enum):
    RISK = "risk"                      # mandatory, sourced from the Risk Engine (RS-1)
    EXPOSURE = "exposure"
    CONCENTRATION = "concentration"
    LEVERAGE = "leverage"
    LIQUIDITY = "liquidity"
    TURNOVER = "turnover"
    MANDATE = "mandate"


class ConstraintSeverity(Enum):
    SOFT = "soft"
    HARD = "hard"  # a hard-constraint breach blocks approval (PS-2)


@dataclass(frozen=True, slots=True)
class PortfolioConstraint:
    """A deterministic portfolio constraint.

    ``source`` references its origin (e.g. a Risk Engine assessment for RISK constraints, by identity).
    ``expression`` names the constraint (evaluated by the deterministic engine); no math here.
    """

    kind: ConstraintKind
    name: str
    expression: str
    severity: ConstraintSeverity
    source: Ref | None


class ConstraintManagementService(Protocol):
    """Manages (versioned) portfolio constraints, incl. mandatory risk constraints. Interface only."""

    def add_constraint(self, portfolio: EntityId, constraint: PortfolioConstraint) -> None: ...
