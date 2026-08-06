"""Experiment domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ExperimentRegistered(DomainEvent):
    """An experiment was registered with an immutable manifest before execution (canonical, EX-1)."""

    experiment_id: EntityId


@dataclass(frozen=True, slots=True)
class TrialRecorded(DomainEvent):
    """A trial was appended to the Trial Ledger (run, discarded, or failed) (EX-4)."""

    experiment_id: EntityId
    trial_id: EntityId
