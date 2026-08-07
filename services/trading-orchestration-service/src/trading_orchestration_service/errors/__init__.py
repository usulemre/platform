"""Orchestration errors. The pipeline itself adjudicates nothing (WCON-2), so it raises only when its
*own* inputs are structurally malformed; every engine-level rejection is captured as a fail-closed
``TradingDecisionRecord`` outcome, not an exception."""
from __future__ import annotations

from core_domain.shared import DomainError


class OrchestrationError(DomainError):
    """Base for trading-orchestration errors."""


class MalformedPipelineRequest(OrchestrationError):
    """A pipeline request is structurally invalid before any engine runs (fail closed)."""


__all__ = ["MalformedPipelineRequest", "OrchestrationError"]
