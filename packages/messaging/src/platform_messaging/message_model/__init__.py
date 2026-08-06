"""Message Model — the message types, the transport-neutral envelope, and message kinds (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_messaging.metadata import MessageHeader


class MessageType(Enum):
    """The institutional message types."""

    COMMAND = "command"
    QUERY = "query"
    EVENT = "event"
    NOTIFICATION = "notification"
    RESPONSE = "response"
    SYSTEM_MESSAGE = "system_message"
    DOMAIN_MESSAGE = "domain_message"
    INTEGRATION_MESSAGE = "integration_message"


class Message:
    """Marker base for any message. Concrete messages are frozen and carry a header."""

    __slots__ = ()


@dataclass(frozen=True, slots=True)
class MessageEnvelope:
    """The transport-neutral wrapper: a header + a typed payload reference.

    ``payload_type`` is the fully-qualified contract type name (a label). The envelope carries NO
    serialized bytes and NO transport concern — those belong to the concrete bus adapter.
    """

    header: MessageHeader
    message_type: MessageType
    payload_type: str


@dataclass(frozen=True, slots=True)
class Notification(Message):
    """A one-way, fire-and-forget message (no response expected)."""

    header: MessageHeader
    topic: str
    summary: str


@dataclass(frozen=True, slots=True)
class SystemMessage(Message):
    """A platform/infrastructure message (health, lifecycle, control)."""

    header: MessageHeader
    subject: str


@dataclass(frozen=True, slots=True)
class DomainMessage(Message):
    """A message internal to one bounded context."""

    header: MessageHeader
    context: str


@dataclass(frozen=True, slots=True)
class IntegrationMessage(Message):
    """A message crossing bounded-context boundaries (via contracts only, SE-2)."""

    header: MessageHeader
    source_context: str
    target_context: str
