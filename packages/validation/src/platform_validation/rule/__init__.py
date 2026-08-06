"""Validation Rule — a named, deterministic, versioned rule and its evaluator interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, TypeVar

from platform_validation.model import Severity


@dataclass(frozen=True, slots=True)
class ValidationRule:
    """A named, deterministic, versioned structural rule (the logic lives in an outer engine)."""

    rule_id: str
    description: str
    severity: Severity


TSubject = TypeVar("TSubject", contravariant=True)


class RuleEvaluator(Protocol[TSubject]):
    """Evaluates one rule against a subject deterministically. Interface only — no logic here."""

    def evaluate(self, subject: TSubject) -> bool: ...
