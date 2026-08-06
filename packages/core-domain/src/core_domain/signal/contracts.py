"""Signal repository and lifecycle-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Signal


class SignalRepository(Protocol):
    """Append-only repository of signal versions (immutable; register-before-use)."""

    def get(self, id: EntityId) -> Signal: ...
    def add(self, signal: Signal) -> None: ...


class SignalLifecycleService(Protocol):
    """Interface: governs registration and retirement transitions. No logic here."""

    def register(self, signal: EntityId) -> None: ...
    def retire(self, signal: EntityId) -> None: ...
