"""Signal Policies — deterministic policy INTERFACES governing signals (no logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class SignalPolicy(Protocol):
    """Marker for a deterministic, versioned signal policy."""

    ...


class DeterministicDecisionPolicy(Protocol):
    """Signal decisions are deterministic; no ML/LLM decides (DE-1, AI-1). Interface only."""

    def is_deterministic(self, signal: EntityId) -> bool: ...


class NetOfCostPolicy(Protocol):
    """Signals are net-of-cost; gross selection is PROHIBITED (AD-1). Interface only."""

    def is_net_of_cost(self, signal: EntityId) -> bool: ...


class MandatoryRiskApprovalPolicy(Protocol):
    """A signal is never ACTIVE without an approved Risk assessment (RS-1). Interface only."""

    def has_risk_approval(self, signal: EntityId) -> bool: ...


class IsolationBarrierPolicy(Protocol):
    """Signal generation MUST NOT observe validation/OOS outcomes (AD-3, P2-07). Interface only."""

    def may_observe(self, signal: EntityId, resource: str) -> bool: ...


class NoPortfolioConstructionPolicy(Protocol):
    """The Signal Engine never constructs portfolios (boundary). Interface only."""

    def is_signal_only(self, signal: EntityId) -> bool: ...


class NoExecutionAuthorityPolicy(Protocol):
    """The Signal Engine holds no execution authority (boundary). Interface only."""

    def has_no_execution_authority(self, signal: EntityId) -> bool: ...
