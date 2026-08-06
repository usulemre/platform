"""Research Registration — register-before-run and pre-registration INTERFACES (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.research import PreRegistration
from core_domain.shared import EntityId

from research_service.model import Research


class ResearchRegistrationService(Protocol):
    """Registers a research initiative before any work runs (register-before-run, SM-1). Interface only."""

    def register(self, research: Research) -> None: ...


class PreRegistrationService(Protocol):
    """Freezes the hypothesis's falsifiable prediction and success criteria before evaluation.

    Pre-registration is a one-way lock; post-hoc alteration is p-hacking and PROHIBITED (SM-2, FB-8).
    Interface only — delegates to core_domain.research.PreRegistrationService.
    """

    def pre_register(self, research: EntityId, registration: PreRegistration) -> None: ...
