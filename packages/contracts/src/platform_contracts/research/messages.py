"""Research contracts — Commands, Queries, Requests, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response

# --- DTOs ------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class HypothesisDto(Dto):
    id: Id
    idea_id: Id
    pre_registered: bool


# --- Commands --------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterIdea(Command):
    title: str
    economic_rationale: str


@dataclass(frozen=True, slots=True)
class PreRegisterHypothesis(Command):
    """Freeze the falsifiable prediction and success criteria (one-way lock, SM-2)."""

    hypothesis_id: Id
    prediction: str
    success_criteria: str


# --- Queries ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class GetHypothesis(Query):
    hypothesis_id: Id


# --- Responses -------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterIdeaResponse(Response):
    idea_id: Id


@dataclass(frozen=True, slots=True)
class GetHypothesisResponse(Response):
    hypothesis: HypothesisDto
