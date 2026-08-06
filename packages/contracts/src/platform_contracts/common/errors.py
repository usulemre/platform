"""Canonical error contracts — the structured error shape exchanged between components.

These are DATA contracts (DTOs), not exceptions; each category maps to a constitutional invariant.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .base import Dto


class ErrorCategory(Enum):
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    INVARIANT = "invariant"
    AUTHORITY = "authority"                      # AI-1..4, HO-1
    SEPARATION_OF_POWERS = "separation_of_powers"  # CP-5
    POINT_IN_TIME = "point_in_time"              # PIT-1..4
    ISOLATION_BARRIER = "isolation_barrier"      # AD-3, P2-07
    REPRODUCIBILITY = "reproducibility"          # CP-4, RP-2
    IMMUTABILITY = "immutability"                # CP-2
    PROVENANCE = "provenance"                    # CP-6, DP-3
    VALIDATION = "validation"                    # structural, not statistical
    UNAUTHORIZED = "unauthorized"


@dataclass(frozen=True, slots=True)
class ErrorContract(Dto):
    """A structured, immutable error carried across a contract boundary."""

    code: str
    category: ErrorCategory
    message: str
