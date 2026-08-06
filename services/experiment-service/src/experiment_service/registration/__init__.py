"""Experiment Registration — register-before-run with an immutable manifest & Trial-Ledger linkage."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from experiment_service.model import Experiment


class ExperimentRegistrationService(Protocol):
    """Registers an experiment in the Experiment Registry with an immutable manifest and a Trial-Ledger
    linkage BEFORE any execution (SM-5, EX-1, P2-01, P3-03). Interface only — no persistence.

    An unregistered experiment MUST NOT run; a registered manifest is never mutated (EX-3).
    """

    def register(self, experiment: Experiment) -> EntityId: ...
