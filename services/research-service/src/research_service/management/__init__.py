"""Research Management — the Research Service application/orchestration INTERFACES (no adjudication).

These interfaces orchestrate the research lifecycle and connect datasets/features/experiments/
validation by dependency. They PROPOSE and RECORD; they NEVER adjudicate significance and NEVER
surface validation/OOS outcomes to generation (CP-5, AD-3, P2-07). No statistical logic, no AI.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from research_service.dependencies import ResearchDependency
from research_service.metadata import ResearchMetadata
from research_service.model import Research


class ResearchService(Protocol):
    """The Research Service (interface only): drive the lifecycle of a research initiative."""

    def create(self, research: Research) -> None: ...
    def start(self, research: EntityId) -> None: ...
    def update(self, research: EntityId) -> None: ...
    def submit_for_review(self, research: EntityId) -> None: ...
    def archive(self, research: EntityId) -> None: ...


class ResearchManagementService(Protocol):
    """Orchestrates dependencies and gate routing across datasets/features/experiments/validation.

    It records the outcome of the deterministic validation/scientific gate; it never computes or
    asserts it. Interface only.
    """

    def declare_dependency(self, research: EntityId, dependency: ResearchDependency) -> None: ...
    def record_validation_outcome(self, research: EntityId, passed: bool) -> None: ...


class ResearchCatalogService(Protocol):
    """Describes research initiatives from the catalog. Interface only."""

    def describe(self, research: EntityId) -> ResearchMetadata: ...
