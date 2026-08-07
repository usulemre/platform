"""Event Metadata — the immutable event metadata built on the messaging header (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion
from platform_messaging.metadata import MessageHeader  # reuse the transport-neutral header


@dataclass(frozen=True, slots=True)
class EventMetadata:
    """Immutable event metadata: the messaging header + event schema version + owning context.

    The header carries identity, correlation, causation, and supplied time (never read here, CS-3).
    """

    header: MessageHeader
    schema_version: SchemaVersion
    source_context: str


__all__ = ["EventMetadata", "MessageHeader"]
