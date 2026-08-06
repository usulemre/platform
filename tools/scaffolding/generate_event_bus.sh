#!/usr/bin/env bash
#
# generate_event_bus.sh — Phase 3.3 Event Bus generator.
#
# Governed by: CLAUDE.md (AC-1/3 bus-only comms + isolation, CP-2/6/7, VER-1/2, AI-2, SC-3, RE-1/2);
#              Architecture V2 §5.2 (AI Orchestration / bus), §5.10 (spines), §6.1 (isolation barrier);
#              Implementation Roadmap Phase 1/6; P5-04 (bus partitioning/ACLs), P2-07 (isolation); TDR §14.
#
# Emits the Event Bus as a new shared library, `event_bus`: event core, registry, publisher,
# subscriber, router, dispatcher, envelope, metadata, versioning, filtering, retry, dead-letter,
# lifecycle, validation, errors, and domain-event governance. It BUILDS ON the Phase-1.4 messaging
# foundation (platform_messaging) and TRANSPORTS canonical domain events (core_domain DomainEvents);
# it reuses the messaging primitives rather than duplicating them.
#
# It is the VENDOR/TECHNOLOGY-INDEPENDENT event backbone: canonical interfaces ONLY. It transports
# canonical domain events only, supports event versioning, traceability, replay, and auditability, and
# enforces the isolation barrier via topic restrictions (P2-07). It contains NO messaging technology
# (Kafka/NATS/RabbitMQ), NO queues, NO brokers, NO business logic, NO infrastructure. Deterministic,
# immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/event-bus"
SRC="$PKG/src/event_bus"
cd "$ROOT"

# robust README helper (order: Purpose, Responsibilities, Relationships, Dependencies, Governance)
ebreadme() {
  local dir="$1" name="$2" purpose="${3-}" resp="${4-}" rel="${5-}" deps="${6-}" gov="${7-}"
  cat > "$dir/README.md" <<EOF
# event-bus · $name

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose
$purpose

## Responsibilities
$resp

## Relationships
$rel

## Dependencies
$deps

## Related Governance Documents
$gov
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# event-bus — the vendor-independent Event Bus backbone abstractions (Phase 3.3).
# Standard library + foundations only (contracts, messaging, core-domain). No broker/queue/infra deps.
[project]
name = "event-bus"
version = "0.1.0"
description = "Vendor-independent event backbone: publisher/subscriber/router/registry interfaces & models."
requires-python = ">=3.12"
dependencies = ["platform-contracts", "platform-messaging", "core-domain"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/event_bus"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# event-bus — implemented in Phase 3.3

This shared library contains the Event Bus (the `event_bus` package): event core, registry, publisher,
subscriber, router, dispatcher, envelope, metadata, versioning, filtering, retry, dead-letter,
lifecycle, validation, errors, and domain-event governance. Messaging technologies (Kafka/NATS/
RabbitMQ), queues, brokers, and infrastructure remain forbidden here. It builds on the Phase-1.4
messaging foundation and transports canonical domain events; the concrete bus (Kafka, per the TDR)
plugs in behind these interfaces.
MD

cat > "$PKG/README.md" <<'MD'
# event-bus (package) — `event_bus`

> **Phase 3.3 — Event Bus (implemented).** The institutional event-driven communication backbone
> connecting all bounded contexts, services, workflows, AI agents, and deterministic engines — the
> authoritative messaging abstraction of the platform. **Abstractions only** — no messaging technology,
> no queues, no brokers, no infrastructure.

## Purpose
Provide reliable, traceable, technology-independent event communication (AV2 §5.2/§5.10). It **builds
on** the Phase-1.4 Event & Messaging Foundation (`platform_messaging`) and **transports canonical
domain events** (`core_domain.shared.DomainEvent`), reusing the messaging primitives (header, routing
key, retry/dead-letter policies, schema registry, event category) rather than duplicating them. The
concrete bus (Kafka, per the [TDR](../../docs/architecture/technology_decision_record.md) §14) plugs in
behind these interfaces.

## Boundaries
Agents communicate only via the bus and immutable artifact references (AC-1). The bus enforces the
**isolation barrier** via topic restrictions: a generation subscriber MUST NOT bind a restricted
(validation/OOS) topic (AC-3, `P2-07`, `P5-04`). It transports **canonical domain events only**, holds
no business logic, and contains no broker/queue/infrastructure.

## What is here (Phase 3.3)
16 modules, each a subpackage with its own `README.md`:
`core` · `metadata` · `envelope` · `registry` · `publisher` · `subscriber` · `router` · `dispatcher`
· `filtering` · `versioning` · `retry` · `dead_letter` · `lifecycle` · `validation` · `errors` ·
`governance`.

- **Canonical models:** `DomainEvent` (re-exported from `core_domain`), `EventIdentifier`,
  `EventEnvelope`, `EventMetadata`, `EventPublisher`, `EventSubscriber`, `EventSubscription`,
  `EventTopic`, `EventVersion`, `EventContext`, `EventRoutingRule`, `EventRegistry`.
- **Lifecycle:** `CREATED → VALIDATED → PUBLISHED → ROUTED → DELIVERED → ACKNOWLEDGED → ARCHIVED`
  (+ `FAILED`, `DEAD_LETTER`), supporting retry, replay, filtering, version migration, and
  dead-letter routing; skips forbidden (fail-closed).
- **Domain-event governance:** the `governance` catalog registers the canonical events —
  `ResearchCreated`, `DatasetValidated`, `ExperimentRegistered`, `FeatureAccepted`,
  `BacktestCompleted`, `RiskApproved`, `SignalGenerated`, `PortfolioConstructed`,
  `ExecutionAuthorized`, `WorkflowCompleted` — by type, category, and owning context.

## Boundary rules (verified)
- **Technology/vendor-independent:** stdlib + `platform_contracts`/`platform_messaging`/`core_domain`
  only; a code scan confirms no Kafka/NATS/RabbitMQ/queue/broker imports.
- **Transports canonical domain events only:** `EventEnvelope.event` is a `core_domain` `DomainEvent`;
  `NON_DOMAIN_EVENT` error. **Register-before-publish** via `EventRegistry`.
- **Isolation barrier:** `EventTopic.restricted` + `ISOLATION_BARRIER_VIOLATION` error (AC-3, P2-07).
- **Versioned, traceable, replayable, auditable:** `EventVersion` + reused `SchemaRegistry` (VER-1/2);
  every event carries correlation (traceability); lifecycle supports replay + dead-letter; append-only.
- **Deterministic, immutable:** no ambient time (supplied on the header); all models are `frozen`
  dataclasses (runtime `FrozenInstanceError`).
- **Compiles and imports cleanly**, 16 modules, no circular dependencies.

## Ownership
Accountable role: HSRE (platform); ACL/isolation co-owned by HAI. Architecture owner: ARB.

## Dependencies
`platform_contracts`, `platform_messaging`, `core_domain`.

## Regeneration
Generated by [`tools/scaffolding/generate_event_bus.sh`](../../tools/scaffolding/generate_event_bus.sh)
— idempotent and auditable (IMP-7, IMP-17).

## Related Governance Documents
CLAUDE.md (AC-1/3, CP-2/6/7, VER-1/2, AI-2, SC-3, RE-1/2); Architecture V2 §5.2, §5.10, §6.1;
Implementation Roadmap Phase 1/6; `P5-04`, `P2-07`; RB-20 · CODE; Technology Decision Record §14.
MD

cat > "$SRC/__init__.py" <<'PY'
"""event_bus — the vendor-independent Event Bus backbone.

The institutional event-driven communication backbone connecting all bounded contexts, services,
workflows, AI agents, and deterministic engines. It builds on the Phase-1.4 messaging foundation
(platform_messaging) and transports canonical domain events (core_domain DomainEvents), reusing the
messaging primitives rather than duplicating them.

Boundaries: agents communicate only via the bus and immutable references (AC-1); the bus enforces the
isolation barrier via topic restrictions (AC-3, P2-07). It transports canonical domain events only,
supports versioning/traceability/replay/auditability, and holds no messaging technology, queues,
brokers, business logic, or infrastructure.

Modules: core, metadata, envelope, registry, publisher, subscriber, router, dispatcher, filtering,
versioning, retry, dead_letter, lifecycle, validation, errors, governance.
"""
from __future__ import annotations

from . import (
    core,
    dead_letter,
    dispatcher,
    envelope,
    errors,
    filtering,
    governance,
    lifecycle,
    metadata,
    publisher,
    registry,
    retry,
    router,
    subscriber,
    validation,
    versioning,
)

__all__ = [
    "core", "metadata", "envelope", "registry", "publisher", "subscriber", "router", "dispatcher",
    "filtering", "versioning", "retry", "dead_letter", "lifecycle", "validation", "errors",
    "governance",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# core
# ===========================================================================
D="$SRC/core"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Core — the canonical event identity, topic, context, and the transported DomainEvent.

Re-exports core_domain.shared.DomainEvent (the canonical event the bus transports) and defines the
event-bus identity/topic/context.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent  # re-export: the canonical transported event
from platform_contracts.common import CorrelationId

from platform_messaging.event_model import EventCategory


@dataclass(frozen=True, slots=True)
class EventIdentifier:
    """A stable, immutable identity for a bus event (traceability, CP-7)."""

    value: str


@dataclass(frozen=True, slots=True)
class EventTopic:
    """A partitioned, ACL-governed event topic on the bus (P5-04).

    ``restricted`` marks validation/OOS topics that generation subscribers MUST NOT bind (the isolation
    barrier, AC-3, P2-07); enforcement is by the concrete bus ACLs, not here.
    """

    name: str
    category: EventCategory
    partitioned: bool
    restricted: bool


@dataclass(frozen=True, slots=True)
class EventContext:
    """Immutable context for an event flow (correlation for end-to-end traceability, CP-7)."""

    correlation_id: CorrelationId
    as_of: str | None


__all__ = ["DomainEvent", "EventIdentifier", "EventTopic", "EventContext"]
PY
ebreadme "$D" "core" \
"Define EventIdentifier, EventTopic (partitioned + restriction-aware), EventContext, and re-export the canonical DomainEvent transported by the bus." \
"Provide the canonical event identity/topic/context and the transported domain-event type; encode isolation-awareness via restricted topics; hold no logic." \
"Consumed by every Event Bus module; transports core_domain domain events; topics map to P5-04 partitions/ACLs." \
"core_domain.shared (DomainEvent); platform_contracts.common (CorrelationId); platform_messaging.event_model (EventCategory)." \
"CLAUDE.md (AC-1/3, CP-7, SC-3); Architecture V2 §5.2, §5.10, §6.1; P5-04, P2-07; TDR §14."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
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
PY
ebreadme "$D" "metadata" \
"Define EventMetadata (reusing the messaging MessageHeader): identity, correlation/causation, version, and owning context." \
"Carry immutable event metadata built on the messaging header; add schema version and source context; hold no logic." \
"Consumed by envelope; reuses platform_messaging.MessageHeader." \
"platform_contracts.common (SchemaVersion); platform_messaging.metadata (MessageHeader)." \
"CLAUDE.md (CP-7, CS-3, VER-1); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# envelope
# ===========================================================================
D="$SRC/envelope"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Envelope — the transport-neutral envelope wrapping a canonical domain event (data only).

It carries a canonical DomainEvent + metadata + topic; no serialization or transport here.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent

from event_bus.core import EventIdentifier, EventTopic
from event_bus.metadata import EventMetadata


@dataclass(frozen=True, slots=True)
class EventEnvelope:
    """The immutable, transport-neutral envelope.

    ``event`` is a canonical domain event (the bus transports domain events only); ``payload_type`` is
    its fully-qualified type name. No serialized bytes and no transport concern here.
    """

    event_id: EventIdentifier
    event: DomainEvent
    metadata: EventMetadata
    topic: EventTopic
    payload_type: str
PY
ebreadme "$D" "envelope" \
"Define EventEnvelope: the transport-neutral wrapper carrying a canonical domain event + metadata + topic." \
"Wrap a canonical domain event with its metadata and destination topic immutably; transport domain events only; hold no serialization or transport." \
"Consumed by router, dispatcher, validation, filtering; carries a core_domain DomainEvent." \
"core_domain.shared (DomainEvent); core (EventIdentifier, EventTopic); metadata (EventMetadata)." \
"CLAUDE.md (CP-2/7, AC-1); Architecture V2 §5.2, §5.10; RB-20 · CODE."

# ===========================================================================
# registry
# ===========================================================================
D="$SRC/registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Registry — the register-before-publish registry of event types/schemas (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import SchemaVersion

from platform_messaging.event_model import EventCategory


@dataclass(frozen=True, slots=True)
class EventRegistration:
    """An immutable registration of a canonical event type (register-before-publish)."""

    event_type: str
    category: EventCategory
    version: SchemaVersion
    source_context: str


class EventRegistry(Protocol):
    """Register-before-publish registry of event types/schemas. Interface only — no persistence.

    Only registered, versioned canonical event types may be published (VER-1/2); an unregistered event
    type is rejected fail-closed.
    """

    def register(self, registration: EventRegistration) -> None: ...
    def is_registered(self, event_type: str) -> bool: ...
    def get(self, event_type: str) -> EventRegistration: ...
PY
ebreadme "$D" "registry" \
"Define EventRegistration and the EventRegistry interface: the register-before-publish registry of canonical event types/schemas." \
"Express register-before-publish and versioned registration of event types as an interface; only registered types may be published; hold no persistence." \
"Consumed by publisher and validation; complements the messaging schema registry." \
"platform_contracts.common (SchemaVersion); platform_messaging.event_model (EventCategory); standard library." \
"CLAUDE.md (VER-1/2, CP-7, AC-1); Architecture V2 §5.2, §5.10; RB-20 · CODE."

# ===========================================================================
# publisher
# ===========================================================================
D="$SRC/publisher"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Publisher — the canonical event publisher INTERFACE (registered domain events only; no broker)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import DomainEvent

from event_bus.core import EventTopic


class EventPublisher(Protocol):
    """Publishes a canonical domain event to a topic. Interface only — no broker/queue here.

    Only registered event types may be published; publication is traceable (correlation) and the event
    is a canonical domain event (domain events only).
    """

    def publish(self, topic: EventTopic, event: DomainEvent) -> None: ...
PY
ebreadme "$D" "publisher" \
"Define EventPublisher: the interface to publish a canonical domain event to a topic." \
"Express publication of registered canonical domain events to topics as an interface; hold no broker/queue/transport." \
"Consumed by all producing contexts; realized by the concrete bus (Kafka) behind the interface." \
"core_domain.shared (DomainEvent); core (EventTopic); standard library." \
"CLAUDE.md (AC-1, CP-7); Architecture V2 §5.2, §5.10; P5-04; TDR §14."

# ===========================================================================
# subscriber
# ===========================================================================
D="$SRC/subscriber"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Subscriber — the event subscription model and subscriber INTERFACE (ACL/isolation-aware; no broker)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import DomainEvent

from event_bus.core import EventTopic


@dataclass(frozen=True, slots=True)
class EventSubscription:
    """An immutable subscription of a subscriber to a topic (optionally filtered)."""

    subscriber_id: str
    topic: EventTopic
    filter_ref: str | None


class EventSubscriber(Protocol):
    """Subscribes to a topic and handles delivered events. Interface only — no broker/queue here.

    Binding is subject to ACLs: a generation subscriber MUST NOT bind a restricted (validation/OOS)
    topic (the isolation barrier, AC-3, P2-07). Delivered events are acknowledged for traceability.
    """

    def subscribe(self, subscription: EventSubscription) -> None: ...
    def handle(self, event: DomainEvent) -> None: ...
    def acknowledge(self, event_id: str) -> None: ...
PY
ebreadme "$D" "subscriber" \
"Define EventSubscription and the EventSubscriber interface: subscribe, handle, and acknowledge delivered events." \
"Express topic subscription (ACL/isolation-aware), event handling, and acknowledgement as an interface; hold no broker/queue/transport." \
"Consumed by all consuming contexts; restricted topics enforce the isolation barrier." \
"core_domain.shared (DomainEvent); core (EventTopic); standard library." \
"CLAUDE.md (AC-1/3, CP-7); Architecture V2 §5.2, §5.10, §6.1; P2-07, P5-04."

# ===========================================================================
# router
# ===========================================================================
D="$SRC/router"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Router — the event routing-rule model and router INTERFACE (deterministic; no transport)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.routing import RoutingKey  # reuse

from event_bus.core import EventTopic
from event_bus.envelope import EventEnvelope


@dataclass(frozen=True, slots=True)
class EventRoutingRule:
    """An immutable routing rule: a source pattern to a destination topic + routing key."""

    source_pattern: str
    destination: EventTopic
    routing_key: RoutingKey


class EventRouter(Protocol):
    """Routes an envelope to destination topics deterministically. Interface only — no transport.

    Routing respects topic restrictions (the isolation barrier); it never routes a restricted topic to
    a generation subscriber (P2-07).
    """

    def route(self, envelope: EventEnvelope) -> tuple[EventTopic, ...]: ...
PY
ebreadme "$D" "router" \
"Define EventRoutingRule and the EventRouter interface: deterministic routing of envelopes to destination topics." \
"Represent routing rules as immutable data and expose deterministic routing; respect topic restrictions; hold no transport." \
"Consumed by dispatcher; reuses the messaging RoutingKey; operates on envelopes." \
"platform_messaging.routing (RoutingKey); core (EventTopic); envelope (EventEnvelope)." \
"CLAUDE.md (AC-3, CS-3, SC-3); Architecture V2 §5.2, §5.10, §6.1; P5-04, P2-07."

# ===========================================================================
# dispatcher
# ===========================================================================
D="$SRC/dispatcher"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dispatcher — the dispatcher INTERFACE delivering routed events to subscribers (no queue/broker)."""
from __future__ import annotations

from typing import Protocol

from event_bus.envelope import EventEnvelope


class EventDispatcher(Protocol):
    """Dispatches routed events to subscribers honoring delivery/retry/dead-letter policies. Interface only.

    It never delivers a restricted (validation/OOS) event to a generation subscriber (isolation barrier,
    P2-07). No queue/broker/transport here.
    """

    def dispatch(self, envelope: EventEnvelope) -> None: ...
PY
ebreadme "$D" "dispatcher" \
"Define EventDispatcher: the interface to dispatch routed events to subscribers under delivery/retry/dead-letter policies." \
"Express dispatch/delivery to subscribers as an interface honoring policies and the isolation barrier; hold no queue/broker/transport." \
"Consumes router output; applies retry/dead-letter policies; delivers to subscribers." \
"envelope (EventEnvelope); standard library." \
"CLAUDE.md (AC-1/3, RE-1); Architecture V2 §5.2, §5.10, §6.1; P2-07, P5-04."

# ===========================================================================
# filtering
# ===========================================================================
D="$SRC/filtering"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Filtering — the event filter model and evaluator INTERFACE (deterministic; no logic here)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from event_bus.envelope import EventEnvelope


class EventFilterKind(Enum):
    CATEGORY = "category"
    SOURCE = "source"
    TYPE = "type"
    HEADER = "header"


@dataclass(frozen=True, slots=True)
class EventFilter:
    """A declarative, immutable event filter (evaluated by a deterministic evaluator; no logic here)."""

    kind: EventFilterKind
    expression: str


class EventFilterEvaluator(Protocol):
    """Evaluates a filter against an envelope deterministically. Interface only."""

    def matches(self, envelope: EventEnvelope, filter: EventFilter) -> bool: ...
PY
ebreadme "$D" "filtering" \
"Define EventFilter, EventFilterKind, and the EventFilterEvaluator interface: declarative, deterministic event filtering." \
"Represent filters as immutable declarative data and expose deterministic evaluation; hold no logic." \
"Consumed by subscriber/dispatcher for subscription filtering." \
"envelope (EventEnvelope); standard library." \
"CLAUDE.md (DE-1, CS-3); Architecture V2 §5.2, §5.10; RB-20 · CODE."

# ===========================================================================
# versioning
# ===========================================================================
D="$SRC/versioning"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Versioning — the event version model and migration INTERFACE (reuses the messaging schema registry)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import SchemaVersion

from platform_messaging.versioning import Compatibility, EventSchema, SchemaRegistry  # reuse


@dataclass(frozen=True, slots=True)
class EventVersion:
    """The versioned identity of an event type (a breaking change bumps major, VER-1)."""

    event_type: str
    version: SchemaVersion
    compatibility: Compatibility


class EventVersionMigration(Protocol):
    """Migrates an event across compatible versions (version-migration support). Interface only.

    Historical events remain interpretable under the version in which they were produced (VER-2).
    """

    def migrate(self, event_type: str, to: SchemaVersion) -> None: ...


__all__ = [
    "EventVersion", "EventVersionMigration", "Compatibility", "EventSchema", "SchemaRegistry",
]
PY
ebreadme "$D" "versioning" \
"Define EventVersion and EventVersionMigration and re-export the messaging Compatibility/EventSchema/SchemaRegistry." \
"Govern event schema versioning and version migration so historical events remain interpretable; hold no logic." \
"Reuses platform_messaging.versioning; consumed by registry/validation." \
"platform_contracts.common (SchemaVersion); platform_messaging.versioning (Compatibility, EventSchema, SchemaRegistry)." \
"CLAUDE.md (VER-1/2, DEPR-1..3); Architecture V2 §5.10; RB-20 · CODE; TDR §14."

# ===========================================================================
# retry
# ===========================================================================
D="$SRC/retry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Retry Policy — reuses the messaging retry policy (declarative values, no timers)."""
from __future__ import annotations

from platform_messaging.retry import BackoffStrategy, RetryPolicy  # reuse

__all__ = ["RetryPolicy", "BackoffStrategy"]
PY
ebreadme "$D" "retry" \
"Re-export the messaging RetryPolicy and BackoffStrategy: declarative retry configuration for event delivery." \
"Express retry semantics as declarative data (reused from the messaging foundation); the concrete bus applies them; hold no timers or logic." \
"Reuses platform_messaging.retry; consumed by dispatcher and dead_letter." \
"platform_messaging.retry (RetryPolicy, BackoffStrategy)." \
"CLAUDE.md (RE-1, CS-3); Architecture V2 §5.10; TDR §14."

# ===========================================================================
# dead_letter
# ===========================================================================
D="$SRC/dead_letter"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Dead Letter Abstractions — reuse the messaging dead-letter primitives + a dead-letter router."""
from __future__ import annotations

from typing import Protocol

from platform_messaging.dead_letter import DeadLetterPolicy, DeadLetterQueue, DeadLetterRecord  # reuse


class DeadLetterRouter(Protocol):
    """Routes exhausted events to the dead-letter queue for inspection/replay. Interface only.

    Dead-lettered events are recorded immutably for audit and may be replayed (auditability, CP-7).
    """

    def route_to_dlq(self, record: DeadLetterRecord) -> None: ...


__all__ = ["DeadLetterPolicy", "DeadLetterRecord", "DeadLetterQueue", "DeadLetterRouter"]
PY
ebreadme "$D" "dead_letter" \
"Re-export the messaging dead-letter primitives (DeadLetterPolicy/Record/Queue) and define DeadLetterRouter." \
"Express dead-letter handling for exhausted events (policy, immutable record, queue, router) as interfaces; hold no logic." \
"Reuses platform_messaging.dead_letter; consumed by dispatcher; feeds audit/monitoring and replay." \
"platform_messaging.dead_letter (DeadLetterPolicy, DeadLetterRecord, DeadLetterQueue); standard library." \
"CLAUDE.md (RE-1, CP-7); Architecture V2 §5.10; Incident Response Governance."

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Lifecycle — the canonical event lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from event_bus.core import EventIdentifier


class EventLifecycle(Enum):
    """The canonical event lifecycle (plus FAILED and DEAD_LETTER)."""

    CREATED = "created"
    VALIDATED = "validated"
    PUBLISHED = "published"
    ROUTED = "routed"
    DELIVERED = "delivered"
    ACKNOWLEDGED = "acknowledged"
    ARCHIVED = "archived"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"


L = EventLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[EventLifecycle, EventLifecycle], ...] = (
    (L.CREATED, L.VALIDATED),
    (L.VALIDATED, L.PUBLISHED),
    (L.PUBLISHED, L.ROUTED),
    (L.ROUTED, L.DELIVERED),
    (L.DELIVERED, L.ACKNOWLEDGED),
    (L.ACKNOWLEDGED, L.ARCHIVED),
    # validation failure
    (L.CREATED, L.FAILED),
    (L.VALIDATED, L.FAILED),
    # delivery failure / retry
    (L.DELIVERED, L.FAILED),
    (L.FAILED, L.ROUTED),          # retry
    (L.FAILED, L.DEAD_LETTER),     # exhausted -> dead-letter routing
    # replay from dead-letter
    (L.DEAD_LETTER, L.PUBLISHED),
    (L.DEAD_LETTER, L.ARCHIVED),
)

#: Terminal state. Replay re-publishes a NEW delivery of an event (with lineage), never a mutation.
TERMINAL_STATES: frozenset[EventLifecycle] = frozenset({L.ARCHIVED})


class EventLifecycleService(Protocol):
    """Governs event lifecycle transitions and supported operations. Interface only.

    Supports retry, replay, filtering, version migration, and dead-letter routing; no infrastructure here.
    """

    def transition(self, event: EventIdentifier, to: EventLifecycle) -> None: ...
    def retry(self, event: EventIdentifier) -> None: ...
    def replay(self, event: EventIdentifier) -> None: ...
PY
ebreadme "$D" "lifecycle" \
"Define EventLifecycle (CREATED/VALIDATED/PUBLISHED/ROUTED/DELIVERED/ACKNOWLEDGED/ARCHIVED + FAILED/DEAD_LETTER), the canonical transitions, and the lifecycle service (retry/replay/filtering/version-migration/dead-letter)." \
"Enumerate the event lifecycle and legal transitions as data and expose lifecycle operations; replay re-publishes a new delivery; hold no infrastructure." \
"Consumed by dispatcher/validation; drives retry/replay/dead-letter." \
"core (EventIdentifier); standard library." \
"CLAUDE.md (RE-1/2, CP-2/7); Architecture V2 §5.2, §5.10; RB-20 · CODE."

# ===========================================================================
# validation
# ===========================================================================
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Event Validation — STRUCTURAL validation of an event envelope before publish (never statistical)."""
from __future__ import annotations

from typing import Protocol

from platform_messaging.validation import ValidationResult  # reuse structural result

from event_bus.envelope import EventEnvelope


class EventValidator(Protocol):
    """Structurally validates an event envelope before publish. Interface only.

    It checks the event type is registered, the schema matches, the header is complete (correlation
    present), and the event is a canonical domain event. Structural only — never statistical (AI-2).
    """

    def validate(self, envelope: EventEnvelope) -> ValidationResult: ...


__all__ = ["EventValidator", "ValidationResult"]
PY
ebreadme "$D" "validation" \
"Define the EventValidator interface (reusing the structural ValidationResult): structural validation of an event envelope before publish." \
"Validate event structure (registered type, schema, header, domain-event) before publish; never statistical; hold no logic." \
"Reuses platform_messaging.validation; consumes envelopes; gates the CREATED->VALIDATED transition." \
"platform_messaging.validation (ValidationResult); envelope (EventEnvelope)." \
"CLAUDE.md (AI-2, DE-4, VER-1); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Error Model — the canonical, vendor-neutral Event Bus error model (no infrastructure details)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class EventBusErrorKind(Enum):
    UNREGISTERED_EVENT = "unregistered_event"                # register-before-publish (VER-1)
    SCHEMA_INCOMPATIBLE = "schema_incompatible"              # version compatibility (VER-2)
    NON_DOMAIN_EVENT = "non_domain_event"                    # transports canonical domain events only
    ISOLATION_BARRIER_VIOLATION = "isolation_barrier_violation"  # generation bound a restricted topic (P2-07)
    UNTRACEABLE = "untraceable"                              # missing correlation (CP-7)
    DELIVERY_FAILED = "delivery_failed"
    DEAD_LETTERED = "dead_lettered"


@dataclass(frozen=True, slots=True)
class EventBusError:
    """A canonical, vendor-neutral Event Bus error (no infrastructure/vendor details leaked)."""

    kind: EventBusErrorKind
    message: str


class EventBusFrameworkError(Exception):
    """Base exception for the Event Bus (framework faults, not broker errors)."""
PY
ebreadme "$D" "errors" \
"Define EventBusError, EventBusErrorKind, and EventBusFrameworkError: the canonical, vendor-neutral error model." \
"Express Event Bus errors in vendor-neutral terms (unregistered/schema-incompatible/non-domain/isolation/untraceable/delivery/dead-letter); leak no vendor details; hold no logic." \
"Used across the Event Bus modules." \
"Standard library only." \
"CLAUDE.md (AC-3, VER-1/2, CP-7, AD-3); Architecture V2 §5.2, §5.10, §6.1; P2-07."

# ===========================================================================
# governance
# ===========================================================================
D="$SRC/governance"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Domain Event Governance — the catalog of canonical domain events the bus transports (governance).

Only canonical, registered domain events are transported (register-before-publish). This catalog names
the canonical events by type, category, and owning bounded context.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_messaging.event_model import EventCategory


@dataclass(frozen=True, slots=True)
class CanonicalEventEntry:
    """An immutable catalog entry for a canonical domain event."""

    event_type: str
    category: EventCategory
    source_context: str


C = EventCategory

#: The canonical domain events the bus governs (register-before-publish). Names reference the events
#: defined in their bounded contexts; the bus transports only these (and other registered) domain events.
CANONICAL_EVENTS: tuple[CanonicalEventEntry, ...] = (
    CanonicalEventEntry("ResearchCreated", C.RESEARCH, "research"),
    CanonicalEventEntry("DatasetValidated", C.DATASET, "dataset"),
    CanonicalEventEntry("ExperimentRegistered", C.EXPERIMENT, "experiment"),
    CanonicalEventEntry("FeatureAccepted", C.FEATURE, "feature"),
    CanonicalEventEntry("BacktestCompleted", C.EXPERIMENT, "backtesting"),
    CanonicalEventEntry("RiskApproved", C.RISK, "risk"),
    CanonicalEventEntry("SignalGenerated", C.SIGNAL, "signal"),
    CanonicalEventEntry("PortfolioConstructed", C.PORTFOLIO, "portfolio"),
    CanonicalEventEntry("ExecutionAuthorized", C.EXECUTION, "execution"),
    CanonicalEventEntry("WorkflowCompleted", C.WORKFLOW, "workflow"),
)


class DomainEventGovernance(Protocol):
    """Governs which canonical domain events the bus transports (register-before-publish). Interface only."""

    def is_canonical(self, event_type: str) -> bool: ...
PY
ebreadme "$D" "governance" \
"Define CanonicalEventEntry, the CANONICAL_EVENTS catalog (ResearchCreated, DatasetValidated, ExperimentRegistered, FeatureAccepted, BacktestCompleted, RiskApproved, SignalGenerated, PortfolioConstructed, ExecutionAuthorized, WorkflowCompleted), and the DomainEventGovernance interface." \
"Catalog the canonical domain events the bus transports (type, category, source context); govern register-before-publish; hold no logic." \
"References the domain events defined in their bounded contexts; consumed by registry/publisher." \
"platform_messaging.event_model (EventCategory); standard library." \
"CLAUDE.md (AC-1, CP-7, VER-1); Architecture V2 §5.2, §5.5..§5.9, §5.10; Signal/Portfolio/Execution/Workflow registries."

echo "Event Bus generated."
