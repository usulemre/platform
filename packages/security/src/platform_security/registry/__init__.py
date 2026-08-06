"""Principal Registry — the register-before-use registry of principals (no persistence)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from platform_security.identity import Principal


class IdentityRegistry(Protocol):
    """Register-before-use registry of principals (users/services/agents). Interface only — no persistence.

    An unregistered identity cannot authenticate; registration is append-only and every entry is
    auditable (SEC-2, CP-7).
    """

    def register(self, principal: Principal) -> None: ...
    def get(self, principal: Id) -> Principal: ...
    def is_registered(self, principal: Id) -> bool: ...
