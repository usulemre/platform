"""Marker base for immutable, equality-by-value domain values."""
from __future__ import annotations


class ValueObject:
    """Concrete value objects are frozen dataclasses; they hold no I/O and no business logic."""

    __slots__ = ()
