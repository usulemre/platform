"""Identity Lifecycle — the canonical authn/authz lifecycle states, transitions, status, and service."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id


class IdentityLifecycle(Enum):
    """The canonical identity/credential lifecycle (plus SUSPENDED)."""

    REGISTERED = "registered"
    AUTHENTICATING = "authenticating"
    AUTHENTICATED = "authenticated"
    AUTHORIZED = "authorized"
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPENDED = "suspended"


L = IdentityLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[IdentityLifecycle, IdentityLifecycle], ...] = (
    (L.REGISTERED, L.AUTHENTICATING),
    (L.AUTHENTICATING, L.AUTHENTICATED),
    (L.AUTHENTICATED, L.AUTHORIZED),
    (L.AUTHORIZED, L.ACTIVE),
    (L.ACTIVE, L.EXPIRED),
    # authentication failure
    (L.AUTHENTICATING, L.REGISTERED),
    # renewal (re-authenticate)
    (L.EXPIRED, L.AUTHENTICATING),
    (L.ACTIVE, L.AUTHENTICATING),
    # suspension / resume
    (L.ACTIVE, L.SUSPENDED),
    (L.SUSPENDED, L.ACTIVE),
    # revocation (from any live state)
    (L.ACTIVE, L.REVOKED),
    (L.SUSPENDED, L.REVOKED),
    (L.EXPIRED, L.REVOKED),
    (L.AUTHORIZED, L.REVOKED),
)

#: Terminal state.
TERMINAL_STATES: frozenset[IdentityLifecycle] = frozenset({L.REVOKED})


@dataclass(frozen=True, slots=True)
class IdentityStatus:
    """The current lifecycle status of an identity (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: IdentityLifecycle
    since: str


class IdentityLifecycleService(Protocol):
    """Governs identity lifecycle transitions and supported operations. Interface only.

    Supports renewal, revocation, suspension, and delegation (bounded, recorded); no protocol here.
    A human governance decision cannot be overridden by AI (HO-1).
    """

    def transition(self, principal: Id, to: IdentityLifecycle) -> None: ...
    def renew(self, principal: Id) -> None: ...
    def revoke(self, principal: Id) -> None: ...
    def suspend(self, principal: Id) -> None: ...
    def delegate(self, principal: Id, to_principal: Id) -> None: ...
