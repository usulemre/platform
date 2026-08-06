"""Experiment event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class ExperimentRegistered(Event):
    """Canonical event: an experiment was registered with an immutable manifest (EX-1)."""

    experiment_id: Id


@dataclass(frozen=True, slots=True)
class TrialRecorded(Event):
    experiment_id: Id
    trial_id: Id
