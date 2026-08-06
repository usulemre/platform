"""Risk contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import ActorRef, Command, Dto, Id, Query, Response


class RiskVerdict(Enum):
    WITHIN_LIMITS = "within_limits"
    BREACH = "breach"


@dataclass(frozen=True, slots=True)
class RiskLimitDto(Dto):
    name: str
    threshold: float


@dataclass(frozen=True, slots=True)
class RiskAssessmentDto(Dto):
    subject_id: Id
    verdict: RiskVerdict


@dataclass(frozen=True, slots=True)
class EvaluateRisk(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class EngageKillSwitch(Command):
    """Force execution to paper/halt; human-invocable, NEVER AI-gated (RS-3, HO-4)."""

    invoked_by: ActorRef


@dataclass(frozen=True, slots=True)
class GetRiskAssessment(Query):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class RiskVerdictResponse(Response):
    assessment: RiskAssessmentDto
