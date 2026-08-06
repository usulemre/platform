"""Risk domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class RiskValidated(DomainEvent):
    """Independent risk sign-off was granted at promotion (canonical event, RS-2)."""

    subject_id: EntityId


@dataclass(frozen=True, slots=True)
class LimitBreached(DomainEvent):
    """A deterministic risk limit was breached (RS-1)."""

    subject_id: EntityId
    limit_name: str


@dataclass(frozen=True, slots=True)
class KillSwitchEngaged(DomainEvent):
    """The kill-switch was engaged, forcing paper/halt (human-invocable, RS-3)."""

    engaged_by: str
