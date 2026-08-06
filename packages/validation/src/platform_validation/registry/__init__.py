"""Validation Registry — the append-only registry INTERFACE for validators (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_validation.metadata import ValidationMetadata
from platform_validation.model import ValidationCategory


@dataclass(frozen=True, slots=True)
class ValidationRecord:
    """An immutable registry record of a validator's existence and category."""

    validator_id: Id
    category: ValidationCategory


class ValidationRegistry(Protocol):
    """Append-only registry of validators (register-before-use). Interface only — no persistence."""

    def get(self, validator_id: Id) -> ValidationMetadata: ...
    def register(self, metadata: ValidationMetadata) -> None: ...
