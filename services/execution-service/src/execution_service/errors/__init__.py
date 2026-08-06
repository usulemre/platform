"""Execution Errors — Execution Engine domain errors (each expresses a violated execution invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class ExecutionError(DomainError):
    """Base for Execution Engine errors."""


class UnauthorizedExecution(ExecutionError):
    """Live execution/authorization attempted without a valid governance token (RS-4, FB-12)."""


class AIExecutionAttempt(ExecutionError):
    """An AI attempted to execute or authorize execution (AI-1, FB-1)."""


class OrderSubmissionAttempt(ExecutionError):
    """The engine attempted to submit a production order (out of scope — plans only)."""


class BrokerCommunicationAttempt(ExecutionError):
    """The engine attempted to communicate directly with a broker (out of scope)."""


class ExchangeConnectivityAttempt(ExecutionError):
    """The engine attempted direct exchange connectivity (out of scope)."""


class ParityBreach(ExecutionError):
    """A research-to-production parity breach blocks authorization (P3-15)."""


class IrreversibleDeployment(ExecutionError):
    """A deployment/plan that cannot be safely unwound (DEP-3)."""


class MissingRiskAuthority(ExecutionError):
    """Authorization was attempted without the required Risk Engine sign-off (RS-1/2)."""


class IllegalExecutionTransition(ExecutionError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
