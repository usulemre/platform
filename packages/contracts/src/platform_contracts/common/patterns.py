"""Base interface patterns for Policies, Specifications, Repository and Service contracts."""
from __future__ import annotations

from typing import Protocol, TypeVar

from .ids import Id

T = TypeVar("T")
TCandidate = TypeVar("TCandidate", contravariant=True)


class Policy(Protocol):
    """Marker for a deterministic, versioned policy contract (behavior lives in an engine)."""

    ...


class Specification(Protocol[TCandidate]):
    """A deterministic, testable predicate contract (DE-1). Interface only."""

    def is_satisfied_by(self, candidate: TCandidate) -> bool: ...


class RepositoryContract(Protocol[T]):
    """Read/append contract for immutable, versioned artifacts (add + supersede, never mutate)."""

    def get(self, id: Id) -> T: ...
    def add(self, item: T) -> None: ...


class ServiceContract(Protocol):
    """Marker for a stateless service contract (a set of request/response operations)."""

    ...
