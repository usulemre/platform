"""Feature event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class FeatureProposed(Event):
    feature_id: Id


@dataclass(frozen=True, slots=True)
class FeatureAccepted(Event):
    """Canonical event: a feature passed the leakage harness and acceptance gate (FA-1..4)."""

    feature_id: Id
