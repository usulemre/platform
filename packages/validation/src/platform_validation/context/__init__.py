"""Validation Context — the immutable context for a validation run (deterministic)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import ActorRef, CorrelationId, Id

from platform_validation.model import ValidationCategory


@dataclass(frozen=True, slots=True)
class ValidationContext:
    """Immutable context for a validation run.

    ``as_of`` is a supplied ISO-8601 knowledge-time for any point-in-time read a validator performs
    (PIT-1); the framework reads no ambient time (CS-3).
    """

    subject_id: Id
    category: ValidationCategory
    actor: ActorRef
    correlation_id: CorrelationId
    as_of: str | None
