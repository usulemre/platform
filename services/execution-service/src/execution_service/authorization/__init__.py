"""Execution Authorization — the governance authorization model and INTERFACE (token-gated live).

Live execution is impossible without a valid, time-boxed governance authorization token (RS-4);
default is PAPER (DEP-1); an LLM NEVER authorizes (AI-1); the kill-switch forces HALT (human, RS-3).
Reuses core_domain.execution.AuthorizationToken / ExecutionMode.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.execution import AuthorizationToken, ExecutionMode
from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class ExecutionAuthorization:
    """A governance authorization for an execution plan.

    ``token`` is required for LIVE (valid + time-boxed, RS-4) and is None for PAPER (DEP-1). A
    capital-affecting authorization requires human counter-sign (HO-2); no AI authorizes (AI-1).
    """

    mode: ExecutionMode
    token: AuthorizationToken | None
    authorizer_role: str
    counter_signed: bool


class ExecutionAuthorizationService(Protocol):
    """Authorizes an execution plan. Interface only.

    LIVE requires a valid governance token + independent risk sign-off + parity clearance; PAPER is the
    default; the kill-switch can force HALT (human-invocable, never AI).
    """

    def authorize(self, execution: EntityId, mode: ExecutionMode) -> ExecutionAuthorization: ...
    def revoke(self, execution: EntityId) -> None: ...
    def engage_kill_switch(self, execution: EntityId, invoked_by: str) -> None: ...
