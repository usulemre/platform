"""Research repository and domain-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Hypothesis, Idea, PreRegistration


class IdeaRepository(Protocol):
    """Append-only repository of ideas (immutable; supersede, never mutate)."""

    def get(self, id: EntityId) -> Idea: ...
    def add(self, idea: Idea) -> None: ...


class HypothesisRepository(Protocol):
    """Append-only repository of hypotheses."""

    def get(self, id: EntityId) -> Hypothesis: ...
    def add(self, hypothesis: Hypothesis) -> None: ...


class PreRegistrationService(Protocol):
    """Interface: freezes a hypothesis's pre-registration (lock is one-way, SM-2). No logic here."""

    def pre_register(self, hypothesis: EntityId, registration: PreRegistration) -> None: ...
