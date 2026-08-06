"""Risk event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class RiskValidated(Event):
    """Canonical event: independent risk sign-off was granted at promotion (RS-2)."""

    subject_id: Id


@dataclass(frozen=True, slots=True)
class LimitBreached(Event):
    subject_id: Id
    limit_name: str


@dataclass(frozen=True, slots=True)
class KillSwitchEngaged(Event):
    engaged_by: str
