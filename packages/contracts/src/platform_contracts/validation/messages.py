"""Validation contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import Command, Dto, Id, Query, Response


class Verdict(Enum):
    PASS = "pass"
    FAIL = "fail"


@dataclass(frozen=True, slots=True)
class DeflatedMetricDto(Dto):
    name: str
    value: float


@dataclass(frozen=True, slots=True)
class VerdictDto(Dto):
    subject_id: Id
    verdict: Verdict


@dataclass(frozen=True, slots=True)
class RunValidation(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class AllocateHoldout(Command):
    """One-shot, rotating holdout; iterative reuse is PROHIBITED (SI-4, P2-05)."""

    subject_id: Id


@dataclass(frozen=True, slots=True)
class RequestReplication(Command):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class GetVerdict(Query):
    subject_id: Id


@dataclass(frozen=True, slots=True)
class ValidationVerdictResponse(Response):
    verdict: VerdictDto
