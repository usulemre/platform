"""Research Domain Events — immutable facts about a research initiative (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class ResearchCreated(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchRegistered(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchStarted(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchUpdated(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchSubmittedForReview(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchValidated(DomainEvent):
    """Records that the deterministic validation/scientific gate passed (the engine decided, not us)."""

    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchApproved(DomainEvent):
    research_id: EntityId


@dataclass(frozen=True, slots=True)
class ResearchArchived(DomainEvent):
    research_id: EntityId
