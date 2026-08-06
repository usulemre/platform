"""Causation Context — the id of the message that directly caused this one (causation chain)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CausationId:
    """The id of the message that directly caused the current message."""

    value: str


@dataclass(frozen=True, slots=True)
class CausationContext:
    """Carries the direct cause of a message; None for a root/originating message."""

    caused_by: CausationId | None


__all__ = ["CausationId", "CausationContext"]
