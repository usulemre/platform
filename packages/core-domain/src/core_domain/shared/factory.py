"""Factory marker — encapsulates valid construction of a domain object. Interface only."""
from __future__ import annotations

from typing import Protocol, TypeVar

T = TypeVar("T", covariant=True)


class Factory(Protocol[T]):
    """Interface only; no construction logic in the domain foundation."""

    ...
