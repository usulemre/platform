"""Research bounded context — the research lifecycle: ideas and pre-registered hypotheses."""
from __future__ import annotations

from .contracts import HypothesisRepository, IdeaRepository, PreRegistrationService
from .errors import HypothesisNotFalsifiable, PreRegistrationLocked
from .events import HypothesisPreRegistered, ResearchCreated
from .model import (
    EconomicRationale,
    FalsifiablePrediction,
    Hypothesis,
    Idea,
    PreRegistration,
    SuccessCriteria,
)

__all__ = [
    "FalsifiablePrediction", "SuccessCriteria", "EconomicRationale", "PreRegistration",
    "Idea", "Hypothesis",
    "ResearchCreated", "HypothesisPreRegistered",
    "IdeaRepository", "HypothesisRepository", "PreRegistrationService",
    "PreRegistrationLocked", "HypothesisNotFalsifiable",
]
