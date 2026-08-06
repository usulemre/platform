"""platform_messaging — the technology-independent event & messaging abstractions.

Defines HOW every component communicates through events and messages: the event/message/command/
query models, the transport-neutral envelope, correlation & causation, the event taxonomy and
lifecycle, the event-bus and routing interfaces, and delivery/retry/dead-letter policies.

Boundaries: no broker, no transport, no serialization, no persistence, no business logic. Time is
supplied on envelopes, never read (CS-3). Every message is correlation- and causation-stamped for
complete traceability (CP-7). The bus abstraction is partitioned and ACL-aware; generation
subscribers cannot bind validation/OOS topics (the isolation barrier, P2-07).
"""
from __future__ import annotations

from . import (
    causation,
    command_model,
    correlation,
    dead_letter,
    delivery,
    event_bus,
    event_model,
    message_model,
    metadata,
    query_model,
    retry,
    routing,
    validation,
    versioning,
)

__all__ = [
    "event_model", "message_model", "command_model", "query_model", "event_bus", "routing",
    "correlation", "causation", "delivery", "retry", "dead_letter", "validation", "versioning",
    "metadata",
]
__version__ = "0.1.0"
