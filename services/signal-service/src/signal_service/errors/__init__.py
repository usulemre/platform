"""Signal Errors — Signal Engine domain errors (each expresses a violated signal invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class SignalError(DomainError):
    """Base for Signal Engine errors."""


class SignalMissingRiskApproval(SignalError):
    """A signal was activated without a mandatory approved Risk assessment (RS-1, PS-1)."""


class GrossSignalSelection(SignalError):
    """A signal was selected on gross (pre-cost) performance (AD-1, AP-10)."""


class GeneratorObservedValidation(SignalError):
    """Signal generation observed validation/OOS outcomes (AD-3, P2-07)."""


class MLSignalDecision(SignalError):
    """An ML/LLM attempted to decide a signal (DE-1, AI-1)."""


class PortfolioConstructionAttempt(SignalError):
    """The Signal Engine attempted portfolio construction (out of scope, boundary)."""


class ExecutionAuthorityAttempt(SignalError):
    """The Signal Engine attempted execution or to authorize execution (out of scope, boundary)."""


class SignalNotRegistered(SignalError):
    """A signal was used/activated before registration in the Signal Registry (register-before-use)."""


class IllegalSignalTransition(SignalError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(SignalError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
