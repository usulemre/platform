"""Validation Specification — composable deterministic predicates (DE-1). Interfaces + data."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol, TypeVar

TCandidate = TypeVar("TCandidate", contravariant=True)


class ValidationSpecification(Protocol[TCandidate]):
    """A composable, deterministic predicate over a candidate. Interface only — no logic here."""

    def is_satisfied_by(self, candidate: TCandidate) -> bool: ...


class CompositeKind(Enum):
    AND = "and"
    OR = "or"
    NOT = "not"


@dataclass(frozen=True, slots=True)
class CompositeSpecification:
    """A declarative composition of named specifications (composability).

    ``operands`` reference specifications by name; this is DATA describing composition, not logic.
    """

    kind: CompositeKind
    operands: tuple[str, ...]
