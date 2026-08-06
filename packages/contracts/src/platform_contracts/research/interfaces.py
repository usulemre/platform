"""Research repository, service, policy, and validation contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id, Policy, ValidationContract

from .messages import (
    GetHypothesis,
    GetHypothesisResponse,
    HypothesisDto,
    PreRegisterHypothesis,
    RegisterIdea,
    RegisterIdeaResponse,
)


class ResearchRepositoryContract(Protocol):
    def get(self, id: Id) -> HypothesisDto: ...
    def add(self, hypothesis: HypothesisDto) -> None: ...


class ResearchServiceContract(Protocol):
    def register_idea(self, command: RegisterIdea) -> RegisterIdeaResponse: ...
    def pre_register(self, command: PreRegisterHypothesis) -> None: ...
    def get_hypothesis(self, query: GetHypothesis) -> GetHypothesisResponse: ...


class PreRegistrationPolicy(Policy, Protocol):
    """Deterministic policy: pre-registration is a one-way lock (SM-2)."""


class HypothesisValidationContract(ValidationContract[PreRegisterHypothesis], Protocol):
    """Structural validation of a pre-registration command (not statistical)."""
