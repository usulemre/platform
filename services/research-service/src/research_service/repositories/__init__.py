"""Research Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from research_service.dependencies import ResearchDependency
from research_service.model import Research


class ResearchRepositoryContract(Protocol):
    """Append-only repository of research initiatives (immutable; supersede, never mutate, CP-2).

    A backward transition (reopening a killed effort) creates a NEW versioned lineage, never a
    mutation of history (RL-1). No persistence here.
    """

    def get(self, research: EntityId) -> Research: ...
    def add(self, research: Research) -> None: ...


class ResearchDependencyRepository(Protocol):
    """Retrieval of a research initiative's declared dependencies. Interface only."""

    def dependencies_of(self, research: EntityId) -> tuple[ResearchDependency, ...]: ...
