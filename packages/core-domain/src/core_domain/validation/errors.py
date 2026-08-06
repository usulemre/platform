"""Validation domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class OOSReuse(DomainError):
    """Iterative re-testing against the out-of-sample resource (SI-4, P2-05)."""


class UndeflatedSignificance(DomainError):
    """Significance asserted without deflation for the number of trials (SI-3)."""


class LLMValidationAttempt(DomainError):
    """An LLM attempted to assert significance or a verdict (AI-2, FB-2)."""


class ReplicationFailed(DomainError):
    """A candidate failed independent replication (VS-4, P2-08)."""
