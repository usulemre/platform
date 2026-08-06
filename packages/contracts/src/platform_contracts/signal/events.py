"""Signal event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class SignalGenerated(Event):
    """Canonical event: a signal was generated from accepted features (net-of-cost, AD-1)."""

    signal_id: Id


@dataclass(frozen=True, slots=True)
class SignalRetired(Event):
    signal_id: Id
