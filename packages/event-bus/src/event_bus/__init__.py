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
