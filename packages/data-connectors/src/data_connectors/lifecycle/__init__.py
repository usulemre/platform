"""Connector Lifecycle — the canonical lifecycle states, transitions, status, and lifecycle service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class ConnectorLifecycle(Enum):
    """The canonical connector lifecycle."""

    REGISTERED = "registered"
    CONFIGURED = "configured"
    INITIALIZED = "initialized"
    CONNECTED = "connected"
    ACTIVE = "active"
    DEGRADED = "degraded"
    DISCONNECTED = "disconnected"
    RETIRED = "retired"


L = ConnectorLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ConnectorLifecycle, ConnectorLifecycle], ...] = (
    (L.REGISTERED, L.CONFIGURED),
    (L.CONFIGURED, L.INITIALIZED),
    (L.INITIALIZED, L.CONNECTED),
    (L.CONNECTED, L.ACTIVE),
    # health degradation / recovery
    (L.ACTIVE, L.DEGRADED),
    (L.DEGRADED, L.ACTIVE),
    (L.DEGRADED, L.DISCONNECTED),
    # disconnect / reconnect (graceful)
    (L.ACTIVE, L.DISCONNECTED),
    (L.CONNECTED, L.DISCONNECTED),
    (L.DISCONNECTED, L.CONNECTED),
    # graceful shutdown / retirement
    (L.DISCONNECTED, L.RETIRED),
    (L.CONFIGURED, L.RETIRED),
    (L.REGISTERED, L.RETIRED),
)

#: Terminal state.
TERMINAL_STATES: frozenset[ConnectorLifecycle] = frozenset({L.RETIRED})


@dataclass(frozen=True, slots=True)
class ConnectionStatus:
    """The current lifecycle status of a connector (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ConnectorLifecycle
    since: str


class ConnectorLifecycleService(Protocol):
    """Governs connector lifecycle transitions and supported operations. Interface only.

    Supports reconnect, health check, capability refresh, and graceful shutdown; no infrastructure or
    provider logic here.
    """

    def transition(self, connector: Id, to: ConnectorLifecycle) -> None: ...
    def reconnect(self, connector: Id) -> None: ...
    def refresh_capabilities(self, connector: Id) -> None: ...
    def shutdown(self, connector: Id) -> None: ...
