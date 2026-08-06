"""Feature contracts — Commands, Queries, Responses, DTOs."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Command, Dto, Id, Query, Response


@dataclass(frozen=True, slots=True)
class LeakageReportDto(Dto):
    clean: bool
    summary: str


@dataclass(frozen=True, slots=True)
class FeatureDto(Dto):
    id: Id
    accepted: bool


@dataclass(frozen=True, slots=True)
class ProposeFeature(Command):
    definition: str


@dataclass(frozen=True, slots=True)
class AcceptFeature(Command):
    """Accept only when leakage-clean and provenanced (FA-1..4)."""

    feature_id: Id


@dataclass(frozen=True, slots=True)
class GetFeature(Query):
    feature_id: Id


@dataclass(frozen=True, slots=True)
class AcceptFeatureResponse(Response):
    feature_id: Id
    leakage_report: LeakageReportDto
