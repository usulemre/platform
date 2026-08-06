"""Experiment Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from experiment_service.lifecycle import ExperimentLifecycle


@dataclass(frozen=True, slots=True)
class ExperimentStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ExperimentLifecycle
    since: str
