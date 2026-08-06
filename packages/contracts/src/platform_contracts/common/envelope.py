"""The envelope carried by every contract message (identity, version, causation, actor, time)."""
from __future__ import annotations

from dataclasses import dataclass

from .authority import ActorRef
from .ids import CorrelationId, Id
from .versioning import SchemaVersion


@dataclass(frozen=True, slots=True)
class ContractMeta:
    """Immutable metadata on every command/query/event/request/response.

    ``occurred_at`` is an ISO-8601 string supplied by an injected clock, never read here (CS-3).
    """

    message_id: Id
    schema_version: SchemaVersion
    correlation_id: CorrelationId
    occurred_at: str
    actor: ActorRef
