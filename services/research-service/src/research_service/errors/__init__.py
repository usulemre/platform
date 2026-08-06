"""Research Errors — Research Service domain errors (each expresses a violated research invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class ResearchError(DomainError):
    """Base for Research Service errors."""


class ResearchNotRegistered(ResearchError):
    """Research work was attempted before registration (register-before-run, SM-1)."""


class PreRegistrationAltered(ResearchError):
    """Success criteria were altered after pre-registration (p-hacking, SM-2, FB-8)."""


class ResearchSelfAdjudication(ResearchError):
    """Research attempted to adjudicate its own significance/acceptance (separation of powers, CP-5)."""


class IsolationBarrierBreach(ResearchError):
    """Generation observed validation/OOS outcomes (AD-3, P2-07)."""


class NegativeResultDiscarded(ResearchError):
    """A negative result was discarded rather than preserved (SM-4)."""


class IllegalResearchTransition(ResearchError):
    """A lifecycle transition not in the canonical set (fail-closed)."""


class UndeclaredDependency(ResearchError):
    """A hidden cross-context dependency was used without declaration (SE-2, AC-1)."""
