"""core_domain.shared — the shared kernel: primitives every bounded context depends on."""
from __future__ import annotations

from .authority import ActorKind, ActorRef, Authority
from .entity import AggregateRoot, Entity
from .errors import (
    AuthorityViolation,
    Conflict,
    DomainError,
    ImmutabilityViolation,
    InvariantViolation,
    IsolationBarrierViolation,
    NotFound,
    PointInTimeViolation,
    ProvenanceRequired,
    ReproducibilityViolation,
    SeparationOfPowersViolation,
)
from .event import DomainEvent, DomainEventMeta
from .factory import Factory
from .identifiers import ContentAddress, EntityId, Ref, Version, VersionedId
from .policy import Policy
from .provenance import ArtifactClass, LineageRef, Provenance, RunManifestRef
from .repository import (
    AppendOnlyRepository,
    AsOfReadPort,
    ContentAddressedRepository,
    ReadRepository,
)
from .service import DomainService
from .specification import Specification
from .time import AsOf, BitemporalStamp, EventTime, KnowledgeTime, Timestamp
from .value_object import ValueObject

__all__ = [
    "ActorKind", "ActorRef", "Authority",
    "AggregateRoot", "Entity",
    "DomainError", "InvariantViolation", "NotFound", "Conflict", "ImmutabilityViolation",
    "AuthorityViolation", "SeparationOfPowersViolation", "PointInTimeViolation",
    "IsolationBarrierViolation", "ReproducibilityViolation", "ProvenanceRequired",
    "DomainEvent", "DomainEventMeta",
    "Factory", "Policy", "Specification", "DomainService",
    "ContentAddress", "EntityId", "Ref", "Version", "VersionedId",
    "ArtifactClass", "LineageRef", "Provenance", "RunManifestRef",
    "ReadRepository", "AppendOnlyRepository", "ContentAddressedRepository", "AsOfReadPort",
    "AsOf", "BitemporalStamp", "EventTime", "KnowledgeTime", "Timestamp",
    "ValueObject",
]
