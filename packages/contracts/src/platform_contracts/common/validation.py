"""Validation contracts — STRUCTURAL validation only (never statistical significance, AI-2)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, TypeVar

from .base import Dto

TCandidate = TypeVar("TCandidate", contravariant=True)


@dataclass(frozen=True, slots=True)
class Violation(Dto):
    """A single structural rule violation."""

    field: str
    rule: str
    detail: str


@dataclass(frozen=True, slots=True)
class ValidationResult(Dto):
    """The immutable outcome of validating a message/DTO against its schema/rules."""

    valid: bool
    violations: tuple[Violation, ...]


class ValidationContract(Protocol[TCandidate]):
    """Interface: structural validation of a contract message. No logic in the contract layer."""

    def validate(self, candidate: TCandidate) -> ValidationResult: ...
