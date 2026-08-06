#!/usr/bin/env bash
#
# generate_messaging.sh — Phase 1.4 Event & Messaging Foundation generator.
#
# Governed by: CLAUDE.md; Architecture V2 §5.2 (AI Orchestration / bus), §5.10 (cross-cutting spines),
#              §6.1 (isolation barrier); Implementation Roadmap Phase 1; P5-04 (bus partitioning/ACLs),
#              P2-07 (isolation); RB-20 · CODE; TDR §14 (Kafka — this is the ABSTRACTION layer only).
#
# Emits the Event & Messaging ABSTRACTIONS as a new shared library, `platform_messaging`:
# the event/message/command/query models, the transport-neutral envelope, correlation & causation,
# the event taxonomy and lifecycle, the event-bus and routing INTERFACES, delivery/retry/dead-letter
# POLICIES (as data), message validation, and event versioning. It contains NO broker, NO transport,
# NO serialization, NO persistence, NO business logic. Technology-independent, deterministic (no
# ambient time/RNG), immutable, fully traceable (correlation + causation), idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/messaging"
SRC="$PKG/src/platform_messaging"
cd "$ROOT"

mreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 dependencies 6 relationships 7 gov
  cat > "$1/README.md" <<EOF
# messaging · $2

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose
$3

## Responsibilities
$4

## Dependencies
$5

## Relationships
$6

## Related Governance Documents
$7
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# messaging — the technology-independent Event & Messaging abstractions (Phase 1.4).
# Standard library + the platform contract kernel only. No broker/transport/serialization deps.
[project]
name = "platform-messaging"
version = "0.1.0"
description = "Event & messaging abstractions: envelope, correlation/causation, bus & policy interfaces."
requires-python = ">=3.12"
dependencies = ["platform-contracts"]   # depends on the stable contract kernel only (IMP-10)

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_messaging"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# messaging — implemented in Phase 1.4

This shared library contains the Event & Messaging Foundation (the `platform_messaging` package):
the event/message/command/query models, the transport-neutral envelope, correlation & causation,
the event taxonomy and lifecycle, the event-bus and routing interfaces, and delivery/retry/dead-letter
policies. Brokers, transport, serialization, persistence, and business logic remain forbidden here.
The concrete bus (Kafka, per the TDR) plugs in behind these abstractions.
MD

cat > "$PKG/README.md" <<'MD'
# messaging (package) — `platform_messaging`

> **Phase 1.4 — Event & Messaging Foundation (implemented).** The canonical, technology-independent
> event-driven communication abstractions: how every platform component communicates through events
> and messages. **Abstractions only** — no broker, no transport, no serialization, no persistence,
> no business logic.

## Purpose
Define the reusable, deterministic messaging model that realizes the platform's eventing/bus
substrate (Architecture V2 §5.2 AI Orchestration, §5.10 cross-cutting spines; `P5-04` bus
partitioning + ACLs). The concrete broker (Kafka, per the [TDR](../../docs/architecture/technology_decision_record.md) §14)
plugs in **behind** these interfaces. It reuses the `platform_contracts` payload types (`Event`,
`Command`, `Query`, `Response`) and wraps them in a transport-neutral envelope with full
correlation + causation traceability.

## Architectural placement
This is a **new shared library** under `packages/`, mapping to the existing message-bus/eventing
substrate in Architecture V2 (§5.2/§5.10, `P5-04`); it introduces no new top-level concept (RO-1).
It is the abstraction counterpart to `infrastructure/bus/` (topology) and the `platform_contracts`
payloads.

## What is here (Phase 1.4)
14 modules, each a subpackage with its own `README.md`:
`event_model` · `message_model` · `command_model` · `query_model` · `event_bus` · `routing` ·
`correlation` · `causation` · `delivery` · `retry` · `dead_letter` · `validation` · `versioning` ·
`metadata`.

## Event taxonomy & lifecycle
- **14 categories** (`event_model.EventCategory`): Research, Dataset, Experiment, Feature, Signal,
  Strategy, Portfolio, Risk, Validation, Execution, Workflow, Governance, System, Audit.
- **Lifecycle** (`event_model.EventLifecycle`): `CREATED → VALIDATED → PUBLISHED → DELIVERED →
  CONSUMED → ARCHIVED`, with failure states `REJECTED · FAILED · EXPIRED · DEAD_LETTER`.

## Boundary rules (verified)
- **Technology/framework-independent:** standard library + the `platform_contracts` kernel only; no
  broker, transport, or serialization anywhere.
- **Deterministic:** `occurred_at` is supplied on every envelope/metadata, never read (CS-3).
- **Auditable / fully traceable:** every message carries a `CorrelationId` and a `CausationId`,
  giving end-to-end correlation and causation chains (CP-7).
- **Isolation-aware:** the `EventBus` abstraction is partitioned + ACL-aware; generation subscribers
  MUST NOT bind validation/OOS topics (the isolation barrier, `P2-07`, AV2-16) — enforced by the
  concrete bus behind this interface.
- **Immutable:** every event/message/envelope/policy is a `frozen` dataclass.
- **No broker / transport / serialization / persistence / business logic:** bus/router/validator
  methods are `...` placeholders.

## Ownership
Accountable role: HSRE (platform); ACL/isolation co-owned by HAI. Architecture owner: ARB.

## Dependencies
`platform_contracts.common` only. No circular dependencies (modules depend downward toward
`correlation`/`causation`/`metadata`/the contract kernel).

## Regeneration
Generated by [`tools/scaffolding/generate_messaging.sh`](../../tools/scaffolding/generate_messaging.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (CP-2/7, CS-3, AC-1/3, SC-3, VER-1/2); Architecture V2 §5.2, §5.10, §6.1 (AV2-16);
Implementation Roadmap Phase 1; `P5-04`, `P2-07`; RB-20 · CODE; Technology Decision Record §14.
MD

cat > "$SRC/__init__.py" <<'PY'
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
PY

# ===========================================================================
# correlation
# ===========================================================================
D="$SRC/correlation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Correlation Context — groups all messages of one logical flow for end-to-end traceability."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import CorrelationId  # re-exported (single source of truth)


@dataclass(frozen=True, slots=True)
class CorrelationContext:
    """Carries the correlation id that ties every message in one logical flow together (CP-7)."""

    correlation_id: CorrelationId


__all__ = ["CorrelationId", "CorrelationContext"]
PY
mreadme "$D" "correlation" \
"Define the correlation model: CorrelationId (re-exported from the contract kernel) and CorrelationContext, grouping all messages of one logical flow." \
"Carry the correlation id that gives end-to-end traceability across a workflow/run; data only." \
"platform_contracts.common (CorrelationId); standard library." \
"Used by metadata, event_model, and every message header." \
"CLAUDE.md (CP-7, OB-1); Architecture V2 §5.10; Workflow Contracts (traceability)."

# ===========================================================================
# causation
# ===========================================================================
D="$SRC/causation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Causation Context — the id of the message that directly caused this one (causation chain)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CausationId:
    """The id of the message that directly caused the current message."""

    value: str


@dataclass(frozen=True, slots=True)
class CausationContext:
    """Carries the direct cause of a message; None for a root/originating message."""

    caused_by: CausationId | None


__all__ = ["CausationId", "CausationContext"]
PY
mreadme "$D" "causation" \
"Define the causation model: CausationId and CausationContext, capturing the direct cause of each message." \
"Carry the causation link that, with correlation, reconstructs the full causal chain of a flow; data only." \
"Standard library only." \
"Used by metadata and event_model." \
"CLAUDE.md (CP-7); Architecture V2 §5.10; Observability/Audit spine."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
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
PY
mreadme "$D" "metadata" \
"Define MessageHeader (identity, version, correlation, causation, supplied time, actor, content-type label) and MessageMetadata." \
"Carry the transport-neutral header/metadata that make every message identifiable, versioned, and traceable; hold no serialization." \
"platform_contracts.common (Id, SchemaVersion, ActorRef); correlation; causation." \
"Used by message_model (envelope), command_model, query_model." \
"CLAUDE.md (CP-7, CS-3, VER-1); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# event_model
# ===========================================================================
D="$SRC/event_model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Model — the event taxonomy, lifecycle, metadata, and base event kinds (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_messaging.causation import CausationId
from platform_messaging.correlation import CorrelationId


class EventCategory(Enum):
    """The institutional event taxonomy (one category per bounded context, plus system/audit)."""

    RESEARCH = "research"
    DATASET = "dataset"
    EXPERIMENT = "experiment"
    FEATURE = "feature"
    SIGNAL = "signal"
    STRATEGY = "strategy"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    VALIDATION = "validation"
    EXECUTION = "execution"
    WORKFLOW = "workflow"
    GOVERNANCE = "governance"
    SYSTEM = "system"
    AUDIT = "audit"


class EventKind(Enum):
    DOMAIN = "domain"            # a fact within one bounded context
    INTEGRATION = "integration"  # a fact published across bounded contexts
    SYSTEM = "system"            # a platform/infrastructure lifecycle fact
    AUDIT = "audit"             # an audit-trail fact


class EventLifecycle(Enum):
    """The canonical event lifecycle."""

    CREATED = "created"
    VALIDATED = "validated"
    PUBLISHED = "published"
    DELIVERED = "delivered"
    CONSUMED = "consumed"
    ARCHIVED = "archived"
    # failure states
    REJECTED = "rejected"
    FAILED = "failed"
    EXPIRED = "expired"
    DEAD_LETTER = "dead_letter"


@dataclass(frozen=True, slots=True)
class EventMetadata:
    """Immutable classification + trace metadata carried by every messaging event."""

    category: EventCategory
    kind: EventKind
    lifecycle: EventLifecycle
    correlation_id: CorrelationId
    causation_id: CausationId | None
    occurred_at: str  # supplied ISO-8601 (CS-3)


@dataclass(frozen=True, slots=True)
class Event:
    """Messaging-layer base for a classified, lifecycle-aware, immutable event.

    Distinct from ``platform_contracts.common.Event`` (the payload contract): this base adds the
    messaging classification/lifecycle envelope used for transport and audit.
    """

    metadata: EventMetadata


class DomainEvent(Event):
    """A fact within a single bounded context."""

    __slots__ = ()


class IntegrationEvent(Event):
    """A fact published across bounded contexts."""

    __slots__ = ()


class SystemEvent(Event):
    """A platform/infrastructure lifecycle fact (not a domain fact)."""

    __slots__ = ()


class AuditEvent(Event):
    """An audit-trail fact (tamper-evident record; CP-7, SEC-4)."""

    __slots__ = ()
PY
mreadme "$D" "event_model" \
"Define the event taxonomy (EventCategory, 14 categories), EventKind, the canonical EventLifecycle, EventMetadata, and the base event kinds (Event, DomainEvent, IntegrationEvent, SystemEvent, AuditEvent)." \
"Classify and envelope events immutably with category, kind, lifecycle, correlation, and causation; hold no logic. Concrete events live in the contract/workflow layers." \
"correlation; causation; standard library." \
"Consumed by event_bus; complements platform_contracts payload events." \
"CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.10; Workflow/Signal/Dataset events; SEC-4."

# ===========================================================================
# message_model
# ===========================================================================
D="$SRC/message_model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
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
PY
mreadme "$D" "message_model" \
"Define MessageType (commands/queries/events/notifications/responses/system/domain/integration), the MessageEnvelope, and the message kinds (Notification, SystemMessage, DomainMessage, IntegrationMessage)." \
"Provide the transport-neutral wrapper binding a header to a typed payload reference; hold no serialization or transport." \
"metadata (MessageHeader); standard library." \
"Consumed by routing and validation; reuses platform_contracts Response as the response payload." \
"CLAUDE.md (CP-2/7, SE-2); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# command_model
# ===========================================================================
D="$SRC/command_model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Command Model — command message envelope and handler interface (imperatives to engines)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Command, Response  # re-exported payload bases

from platform_messaging.metadata import MessageHeader


@dataclass(frozen=True, slots=True)
class CommandMessage:
    """An envelope binding a command payload (by type) to messaging metadata."""

    header: MessageHeader
    command_type: str  # fully-qualified command contract type name


class CommandHandler(Protocol):
    """A component that handles exactly one command type, returning a response. Interface only.

    A command is a request to a deterministic engine/service; the handler never lets AI decide.
    """

    def handle(self, command: Command) -> Response: ...


__all__ = ["Command", "Response", "CommandMessage", "CommandHandler"]
PY
mreadme "$D" "command_model" \
"Define the command messaging model: the Command payload base (re-exported), CommandMessage envelope, and the CommandHandler interface." \
"Represent imperative requests to deterministic engines/services as messages; a command never decides itself." \
"platform_contracts.common (Command, Response); metadata; standard library." \
"Consumed by routing; targets deterministic engines/services." \
"CLAUDE.md (DE-1, AI-1); Architecture V2 §5.10, §6.3; RB-20 · CODE."

# ===========================================================================
# query_model
# ===========================================================================
D="$SRC/query_model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Query Model — query message envelope and handler interface (reads; as-of where historical)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Query, Response  # re-exported payload bases

from platform_messaging.metadata import MessageHeader


@dataclass(frozen=True, slots=True)
class QueryMessage:
    """An envelope binding a query payload (by type) to messaging metadata."""

    header: MessageHeader
    query_type: str


class QueryHandler(Protocol):
    """A component that answers exactly one query type. Interface only.

    Historical reads carry an as-of on the concrete query (PIT-1); the handler performs no ambient read.
    """

    def handle(self, query: Query) -> Response: ...


__all__ = ["Query", "Response", "QueryMessage", "QueryHandler"]
PY
mreadme "$D" "query_model" \
"Define the query messaging model: the Query payload base (re-exported), QueryMessage envelope, and the QueryHandler interface." \
"Represent read requests as messages; historical reads carry an as-of (PIT-1); hold no logic." \
"platform_contracts.common (Query, Response); metadata; standard library." \
"Consumed by routing; targets read models / the As-Of Gateway." \
"CLAUDE.md (PIT-1); Architecture V2 §5.10, §6.4; RB-08 · PIT."

# ===========================================================================
# event_bus
# ===========================================================================
D="$SRC/event_bus"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Bus Abstraction — publisher/subscriber/bus INTERFACES over a partitioned, ACL'd bus."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.event_model import Event


@dataclass(frozen=True, slots=True)
class Topic:
    """A partitioned, ACL-governed topic on the bus (P5-04).

    ``restricted`` marks validation/OOS topics that generation subscribers MUST NOT bind (the
    isolation barrier, P2-07). Enforcement is by the concrete bus ACLs, not here.
    """

    name: str
    partitioned: bool
    restricted: bool


class EventPublisher(Protocol):
    """Publishes an event to a topic. Interface only."""

    def publish(self, topic: Topic, event: Event) -> None: ...


class EventSubscriber(Protocol):
    """Subscribes to a topic. Interface only. Binding is subject to ACLs (isolation barrier)."""

    def subscribe(self, topic: Topic) -> None: ...


class EventBus(Protocol):
    """Abstraction over the partitioned, ACL'd message bus (Architecture V2 §5.2/§5.10, P5-04).

    The concrete bus (Kafka, per the TDR) enforces topic ACLs so a generation subscriber cannot bind
    a validation/OOS topic (AV2-16, P2-07). No broker/transport/serialization here. Interface only.
    """

    def publisher(self) -> EventPublisher: ...
    def subscriber(self) -> EventSubscriber: ...
PY
mreadme "$D" "event_bus" \
"Define the event-bus abstraction: Topic (partitioned + ACL/restriction-aware), EventPublisher, EventSubscriber, and EventBus interfaces." \
"Express publish/subscribe over a partitioned, ACL-governed bus; encode isolation-awareness via restricted topics; hold no broker/transport." \
"event_model (Event); standard library." \
"Realized by the concrete bus (Kafka, per the TDR); enforces the isolation barrier via ACLs." \
"CLAUDE.md (AC-1/3, SC-3); Architecture V2 §5.2, §5.10, §6.1 (AV2-16); P5-04, P2-07; TDR §14."

# ===========================================================================
# routing
# ===========================================================================
D="$SRC/routing"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Message Routing — routing keys, routes, partitions, and the Router interface (data + interface)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.message_model import MessageEnvelope


@dataclass(frozen=True, slots=True)
class RoutingKey:
    """A deterministic key used to route/partition a message (no ambient inputs)."""

    value: str


@dataclass(frozen=True, slots=True)
class TopicPartition:
    """A concrete topic partition (P5-04)."""

    topic: str
    partition: int


@dataclass(frozen=True, slots=True)
class Route:
    """The resolved destination for a message."""

    destination_topic: str
    routing_key: RoutingKey


class Router(Protocol):
    """Resolves an envelope to a route deterministically. Interface only — no transport."""

    def route(self, envelope: MessageEnvelope) -> Route: ...
PY
mreadme "$D" "routing" \
"Define message routing: RoutingKey, TopicPartition, Route, and the Router interface." \
"Resolve an envelope to a destination topic/partition deterministically; hold no transport or broker logic." \
"message_model (MessageEnvelope); standard library." \
"Used with event_bus; partitions map to P5-04 topic partitions." \
"CLAUDE.md (SC-3, CS-3); Architecture V2 §5.10; P5-04."

# ===========================================================================
# delivery
# ===========================================================================
D="$SRC/delivery"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Delivery Policy — delivery guarantee and ordering as immutable policy data (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DeliveryGuarantee(Enum):
    AT_MOST_ONCE = "at_most_once"
    AT_LEAST_ONCE = "at_least_once"
    EXACTLY_ONCE = "exactly_once"


class Ordering(Enum):
    NONE = "none"
    PARTITION = "partition"
    GLOBAL = "global"


@dataclass(frozen=True, slots=True)
class DeliveryPolicy:
    """The delivery guarantee and ordering a topic/consumer requires."""

    guarantee: DeliveryGuarantee
    ordering: Ordering
PY
mreadme "$D" "delivery" \
"Define DeliveryPolicy: the delivery guarantee (at-most/at-least/exactly-once) and ordering (none/partition/global)." \
"Express delivery semantics as immutable policy data enforced by the concrete bus; hold no logic." \
"Standard library only." \
"Consumed by the event_bus adapter and consumers." \
"CLAUDE.md (RE-1, SC-3); Architecture V2 §5.10, §10; P5-04."

# ===========================================================================
# retry
# ===========================================================================
D="$SRC/retry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Retry Policy — retry/backoff as immutable policy data (values, not timers; no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class BackoffStrategy(Enum):
    NONE = "none"
    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    EXPONENTIAL_JITTER = "exponential_jitter"


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    """Declarative retry configuration. ``base_delay_ms`` is a value; no clock is read here (CS-3)."""

    max_attempts: int
    backoff: BackoffStrategy
    base_delay_ms: int
PY
mreadme "$D" "retry" \
"Define RetryPolicy: max attempts, backoff strategy, and base delay as immutable configuration values." \
"Express retry semantics as declarative data; the concrete bus/consumer applies them; no timers or clock reads here." \
"Standard library only." \
"Used with delivery and dead_letter policies." \
"CLAUDE.md (RE-1, CS-3); Architecture V2 §5.10, §10."

# ===========================================================================
# dead_letter
# ===========================================================================
D="$SRC/dead_letter"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dead Letter Policy — the dead-letter policy, record, and queue interface (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class DeadLetterPolicy:
    """When and where exhausted messages are dead-lettered."""

    enabled: bool
    max_attempts_before_dlq: int
    dlq_topic: str


@dataclass(frozen=True, slots=True)
class DeadLetterRecord:
    """An immutable record of a message routed to the dead-letter queue (auditable, CP-7)."""

    message_id: Id
    reason: str
    attempts: int


class DeadLetterQueue(Protocol):
    """Receives dead-lettered messages for inspection/replay. Interface only."""

    def send(self, record: DeadLetterRecord) -> None: ...
PY
mreadme "$D" "dead_letter" \
"Define DeadLetterPolicy, DeadLetterRecord (immutable, auditable), and the DeadLetterQueue interface." \
"Express dead-letter handling for exhausted messages as policy + record + interface; hold no logic." \
"platform_contracts.common (Id); standard library." \
"Used with retry/delivery; feeds audit/monitoring." \
"CLAUDE.md (RE-1, CP-7); Architecture V2 §5.10; Incident Response Governance."

# ===========================================================================
# validation
# ===========================================================================
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Message Validation — STRUCTURAL validation of a message envelope (never statistical, AI-2)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import ValidationResult  # re-exported structural result

from platform_messaging.message_model import MessageEnvelope


class MessageValidator(Protocol):
    """Validates a message envelope against its schema/rules before publish. Interface only.

    Structural validation only — it MUST NOT assert statistical significance (AI-2, DE-4).
    """

    def validate(self, envelope: MessageEnvelope) -> ValidationResult: ...


__all__ = ["ValidationResult", "MessageValidator"]
PY
mreadme "$D" "validation" \
"Define the MessageValidator interface (structural validation of an envelope) reusing the contract ValidationResult." \
"Validate message structure/schema before publish; never statistical; hold no logic." \
"platform_contracts.common (ValidationResult); message_model; standard library." \
"Used at the publish boundary; complements versioning." \
"CLAUDE.md (AI-2, DE-4); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# versioning
# ===========================================================================
D="$SRC/versioning"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Versioning — event schema identity and compatibility policy (VER-1/2). Interfaces + data."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import SchemaVersion


class Compatibility(Enum):
    NONE = "none"
    BACKWARD = "backward"
    FORWARD = "forward"
    FULL = "full"


@dataclass(frozen=True, slots=True)
class EventSchema:
    """The versioned identity of an event schema (a breaking change bumps major, VER-1)."""

    name: str
    version: SchemaVersion
    compatibility: Compatibility


class SchemaRegistry(Protocol):
    """Governs event-schema evolution; rejects incompatible changes (VER-2). Interface only."""

    def is_compatible(self, current: EventSchema, candidate: EventSchema) -> bool: ...


__all__ = ["Compatibility", "EventSchema", "SchemaRegistry"]
PY
mreadme "$D" "versioning" \
"Define EventSchema (name + version + compatibility), the Compatibility enum, and the SchemaRegistry interface." \
"Govern event schema evolution so historical events remain interpretable and consumers do not break; hold no logic." \
"platform_contracts.common (SchemaVersion); standard library." \
"Enforced by the concrete schema registry (Apicurio, per the TDR)." \
"CLAUDE.md (VER-1/2, DEPR-1..3); Architecture V2 §5.10; TDR §11/§14."

echo "Event & Messaging Foundation generated."
