"""Security Domain Events — immutable facts about identity/auth decisions (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class IdentityRegistered(DomainEvent):
    principal_id: EntityId


@dataclass(frozen=True, slots=True)
class AuthenticationRequested(DomainEvent):
    principal_id: EntityId


@dataclass(frozen=True, slots=True)
class AuthenticationSucceeded(DomainEvent):
    principal_id: EntityId


@dataclass(frozen=True, slots=True)
class AuthenticationFailed(DomainEvent):
    principal_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class AuthorizationGranted(DomainEvent):
    principal_id: EntityId
    resource: str
    action: str


@dataclass(frozen=True, slots=True)
class AuthorizationDenied(DomainEvent):
    principal_id: EntityId
    resource: str
    action: str


@dataclass(frozen=True, slots=True)
class RoleAssigned(DomainEvent):
    principal_id: EntityId
    role: str


@dataclass(frozen=True, slots=True)
class PermissionGranted(DomainEvent):
    principal_id: EntityId
    permission: str


@dataclass(frozen=True, slots=True)
class PermissionRevoked(DomainEvent):
    principal_id: EntityId
    permission: str


@dataclass(frozen=True, slots=True)
class IdentityRevoked(DomainEvent):
    principal_id: EntityId
    reason: str
