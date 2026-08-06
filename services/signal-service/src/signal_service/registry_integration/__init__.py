"""Signal Registry Integration — the port to the Signal Registry (register-before-use; no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.model import Signal


class SignalRegistryPort(Protocol):
    """The port to the Signal Registry. Interface only — the concrete registry stores elsewhere.

    Registration is append-only and immutable; a change creates a new version. A signal is published
    active only after validation and mandatory Risk approval (RS-1).
    """

    def register(self, signal: Signal) -> None: ...
    def publish_active(self, signal: EntityId) -> None: ...
    def is_registered(self, signal: EntityId) -> bool: ...
