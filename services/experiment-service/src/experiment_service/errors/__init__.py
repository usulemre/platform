"""Experiment Errors — Experiment Service domain errors (each expresses a violated invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class ExperimentError(DomainError):
    """Base for Experiment Service errors."""


class UnregisteredExperimentRun(ExperimentError):
    """An experiment was run without prior registration and a Trial-Ledger entry (SM-5, EX-1, FB-5)."""


class ManifestMutation(ExperimentError):
    """An attempt to mutate a registered experiment manifest (EX-3)."""


class TrialNotCounted(ExperimentError):
    """A trial informed a decision without being counted in the Trial Ledger (EX-4)."""


class IrreproducibleExperiment(ExperimentError):
    """An experiment result lacks a manifest or cannot be repeated (EX-2, RP-2)."""


class ExperimentSelfAdjudication(ExperimentError):
    """The experiment attempted to adjudicate its own significance (separation of powers, CP-5)."""


class IsolationBarrierBreach(ExperimentError):
    """Generation observed validation/OOS outcomes (AD-3, P2-07)."""


class IllegalExperimentTransition(ExperimentError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(ExperimentError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
