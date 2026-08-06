"""Portfolio Errors — Portfolio Engine domain errors (each expresses a violated portfolio invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class PortfolioError(DomainError):
    """Base for Portfolio Engine errors."""


class IneligibleAlpha(PortfolioError):
    """Construction consumed a signal lacking a valid capital-eligibility token (PS-1)."""


class GrossOptimization(PortfolioError):
    """Optimization used gross (pre-cost) returns (PS-2)."""


class ConstraintViolation(PortfolioError):
    """A portfolio violates a hard risk/investment constraint (PS-2, RS-1)."""


class AIAllocationDecision(PortfolioError):
    """An LLM/AI attempted to decide allocation or sizing (PS-3, AI-1)."""


class SignalReadjudication(PortfolioError):
    """The Portfolio Engine attempted to re-adjudicate whether a signal is real (PS-1)."""


class ExecutionAuthorityAttempt(PortfolioError):
    """The Portfolio Engine attempted execution or to authorize execution (out of scope, boundary)."""


class ImmutableSnapshotMutation(PortfolioError):
    """An attempt to mutate an approved, immutable portfolio snapshot (PS-4, CP-2)."""


class IllegalPortfolioTransition(PortfolioError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
