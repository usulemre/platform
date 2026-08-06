"""Message Metadata — the transport-neutral header and metadata on every message (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import ActorRef, Id, SchemaVersion

from platform_messaging.causation import CausationId
from platform_messaging.correlation import CorrelationId


@dataclass(frozen=True, slots=True)
class MessageHeader:
    """The immutable, transport-neutral header stamped on every message.

    ``occurred_at`` is a supplied ISO-8601 string (never read here, CS-3). ``content_type`` is a
    label (e.g. ``"application/domain-event"``); it implies NO serialization here.
    """

    message_id: Id
    schema_version: SchemaVersion
    correlation_id: CorrelationId
    causation_id: CausationId | None
    occurred_at: str
    actor: ActorRef
    content_type: str


@dataclass(frozen=True, slots=True)
class MessageMetadata:
    """Additional immutable, non-payload metadata (an ordered set of header key/value labels)."""

    headers: tuple[tuple[str, str], ...]
