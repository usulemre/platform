"""Experiment repository and Trial-Ledger interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Experiment, Trial


class ExperimentRepository(Protocol):
    """Append-only repository of experiments; correcting one creates a new version (EX-3)."""

    def get(self, id: EntityId) -> Experiment: ...
    def add(self, experiment: Experiment) -> None: ...


class TrialLedger(Protocol):
    """Append-only, tamper-evident ledger; a trial is enrolled BEFORE it runs (P2-01)."""

    def append(self, trial: Trial) -> None: ...
    def get(self, id: EntityId) -> Trial: ...


class ReproducibilityService(Protocol):
    """Interface: repeats an experiment from its manifest (deterministic engine implements it)."""

    def repeat(self, experiment: EntityId) -> bool: ...
