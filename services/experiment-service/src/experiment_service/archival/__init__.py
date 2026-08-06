"""Experiment Archival — archives completed/approved experiments (reproducibility preserved)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ExperimentArchivalService(Protocol):
    """Archives an experiment. Interface only.

    Reproducibility-critical manifests/artifacts are never garbage-collected (RP-4, P5-01); negative
    and discarded experiments are preserved as first-class evidence (SM-4).
    """

    def archive(self, experiment: EntityId) -> None: ...
