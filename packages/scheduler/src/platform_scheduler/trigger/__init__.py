"""Trigger Model — the canonical, declarative trigger (opaque expression; no cron parsing here)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class TriggerKind(Enum):
    TIME = "time"              # a time-based schedule (expression is opaque; not cron-parsed here)
    EVENT = "event"            # triggered by a domain event on the Event Bus
    DEPENDENCY = "dependency"  # triggered when upstream dependencies complete
    MANUAL = "manual"


@dataclass(frozen=True, slots=True)
class Trigger:
    """A declarative, immutable trigger.

    ``expression`` is an OPAQUE schedule expression interpreted by the concrete scheduler (NOT parsed
    here, no cron). ``event_ref`` names the domain event type for EVENT triggers.
    """

    kind: TriggerKind
    expression: str
    event_ref: str | None
