"""Experiment domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class UnregisteredExperiment(DomainError):
    """An experiment was run without prior registration and a Trial-Ledger entry (FB-5)."""


class ManifestMutation(DomainError):
    """An attempt to edit an experiment manifest in place (EX-3)."""


class TrialNotCounted(DomainError):
    """A trial informed a decision without being counted in the ledger (EX-4)."""
