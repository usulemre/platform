"""Execution domain model — paper-first, token-gated, deterministic execution (definitions only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, KnowledgeTime, Ref

# --- Value Objects ---------------------------------------------------------


class ExecutionMode(Enum):
    PAPER = "paper"  # default (DEP-1)
    LIVE = "live"    # only under a valid governance authorization token
    HALT = "halt"


@dataclass(frozen=True, slots=True)
class AuthorizationToken:
    """A time-boxed governance authorization token required for live execution (RS-4)."""

    id: str
    expires_at: KnowledgeTime


@dataclass(frozen=True, slots=True)
class ParityReport:
    """Research-to-production parity check outcome (P3-15)."""

    within_tolerance: bool


@dataclass(frozen=True, slots=True)
class Fill:
    """A recorded fill (descriptive)."""

    quantity: float
    price: float


# --- Entities / Aggregates -------------------------------------------------


@dataclass(eq=False)
class Order(AggregateRoot):
    """An order (aggregate root); executed deterministically, paper by default."""

    portfolio: Ref  # -> portfolio.Portfolio
    mode: ExecutionMode


@dataclass(eq=False)
class PositionLedgerEntry(AggregateRoot):
    """An append-only position-ledger entry supporting reconciliation."""

    fill: Fill
