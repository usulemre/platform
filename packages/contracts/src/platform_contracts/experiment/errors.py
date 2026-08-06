"""Experiment error contracts."""
from __future__ import annotations

from enum import Enum


class ExperimentErrorCode(Enum):
    UNREGISTERED_EXPERIMENT = "experiment.unregistered"     # FB-5
    MANIFEST_MUTATION = "experiment.manifest_mutation"      # EX-3
    TRIAL_NOT_COUNTED = "experiment.trial_not_counted"      # EX-4
