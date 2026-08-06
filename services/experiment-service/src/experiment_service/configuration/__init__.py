"""Experiment Configuration — the immutable, reproducibility-bearing configuration (data + interface).

The configuration is part of the reproducibility record; changing it creates a new experiment version
(EX-3, RP-1). Dataset/feature references are by identity (from the Dataset Service / Feature), SE-2.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class ExperimentConfiguration:
    """An immutable experiment configuration.

    ``parameters`` are non-secret label pairs; secrets are never inlined (SEC-3). ``config_hash``
    binds this configuration into the run manifest for reproducibility (RP-1).
    """

    config_hash: str
    dataset_refs: tuple[Ref, ...]   # -> dataset_service datasets (by identity)
    feature_refs: tuple[Ref, ...]   # -> features (by identity)
    parameters: tuple[tuple[str, str], ...]


class ExperimentConfigurationService(Protocol):
    """Configures an experiment (register -> configure); configuration is immutable once set. Interface only."""

    def configure(self, experiment: EntityId, configuration: ExperimentConfiguration) -> None: ...
