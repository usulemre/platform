"""Feature Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from feature_service.lifecycle import FeatureLifecycle


@dataclass(frozen=True, slots=True)
class FeatureStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: FeatureLifecycle
    since: str
