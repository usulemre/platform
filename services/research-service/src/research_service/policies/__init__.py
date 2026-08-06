"""Research Policies — deterministic policy INTERFACES governing research (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class ResearchPolicy(Protocol):
    """Marker for a deterministic, versioned research policy."""

    ...


class RegisterBeforeRunPolicy(Protocol):
    """No research runs before it is registered (SM-1, EX-1). Interface only."""

    def is_registered(self, research: EntityId) -> bool: ...


class PreRegistrationLockPolicy(Protocol):
    """Success criteria are frozen before evaluation; post-hoc change is PROHIBITED (SM-2). Interface only."""

    def is_locked(self, research: EntityId) -> bool: ...


class IsolationBarrierPolicy(Protocol):
    """Generation MUST NOT observe validation/OOS outcomes (AD-3, P2-07). Interface only."""

    def may_observe(self, research: EntityId, resource: str) -> bool: ...


class NegativeResultsPolicy(Protocol):
    """Negative results are first-class and preserved (SM-4). Interface only."""

    def must_preserve(self) -> bool: ...
