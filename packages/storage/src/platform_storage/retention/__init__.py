"""Retention Policies — the retention model and enforcement INTERFACE (reproducibility-critical never GC'd)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class RetentionPolicy:
    """A retention policy.

    ``retain_days`` is None for indefinite retention (reproducibility-critical data, RP-4, P5-01);
    ``tier_after_days`` drives lifecycle tiering so nothing is 'immutable forever, hot forever' (SC-2).
    """

    retain_days: int | None
    reproducibility_critical: bool
    tier_after_days: int


class RetentionEnforcement(Protocol):
    """Deterministically enforces retention. Interface only.

    It MUST NOT permit deletion of reproducibility-critical data (RP-4); it drives tiering (SC-2).
    """

    def may_delete(self, item: Id) -> bool: ...
    def tier_due(self, item: Id) -> bool: ...
