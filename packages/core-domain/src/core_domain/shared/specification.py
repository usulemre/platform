"""Specification pattern — a deterministic, testable predicate over a candidate (DE-1)."""
from __future__ import annotations

from typing import Protocol, TypeVar

TCandidate = TypeVar("TCandidate", contravariant=True)


class Specification(Protocol[TCandidate]):
    """Interface only; concrete specifications are versioned, golden-tested rules in outer layers."""

    def is_satisfied_by(self, candidate: TCandidate) -> bool: ...
