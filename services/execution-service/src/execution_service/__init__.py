"""execution_service — the deterministic Execution Engine (planning and authorization).

Transforms approved portfolio decisions into executable PLANS while enforcing institutional
governance, execution policies, and risk controls. It is the final deterministic authority BEFORE any
external execution adapter.

Authority (RS-3/4, DEP-1, AI-1): it produces PLANS only; it is paper-first by default; live is
impossible without a valid, time-boxed governance authorization token; an LLM NEVER executes or
authorizes; the kill-switch forces HALT (human-invocable). The same engine runs backtest/paper/live
differing only by injected clock and adapter (AV2-23). It reuses core_domain (execution context +
shared kernel) and platform_validation, and references Portfolio/Risk by identity.

Boundaries: NOT broker integration, NOT exchange connectivity, NOT order routing, NOT market
connectivity. It NEVER communicates with brokers/exchanges and NEVER submits production orders. No
broker APIs, no FIX, no REST clients, no persistence, no infrastructure, no API. The external adapter
is downstream and out of scope.

Modules: model, status, lifecycle, planning, authorization, context, session, constraints, scheduling,
validation_coordination, monitoring, reporting, governance, management, policies, specifications,
metadata, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    authorization,
    constraints,
    context,
    errors,
    events,
    governance,
    lifecycle,
    management,
    metadata,
    model,
    monitoring,
    planning,
    policies,
    reporting,
    repositories,
    scheduling,
    session,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "planning", "authorization", "context", "session", "constraints",
    "scheduling", "validation_coordination", "monitoring", "reporting", "governance", "management",
    "policies", "specifications", "metadata", "events", "errors", "repositories",
]
__version__ = "0.1.0"
