"""Portfolio Domain Events — immutable facts about a portfolio (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class PortfolioCreated(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioConstructed(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided)."""

    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioApproved(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioRejected(DomainEvent):
    portfolio_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class PortfolioRebalanced(DomainEvent):
    portfolio_id: EntityId
    new_version_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioArchived(DomainEvent):
    portfolio_id: EntityId


@dataclass(frozen=True, slots=True)
class PortfolioConstraintViolated(DomainEvent):
    portfolio_id: EntityId
    constraint: str


@dataclass(frozen=True, slots=True)
class PortfolioRegistryUpdated(DomainEvent):
    portfolio_id: EntityId
