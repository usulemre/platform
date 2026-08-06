"""portfolio_service — the deterministic Portfolio Engine.

Transforms approved investment signals into governed portfolio candidates, enforcing portfolio
construction principles, investment constraints, and institutional allocation policies. The
authoritative source of truth for portfolio composition.

Authority (PS-1..4, AI-1): it consumes only capital-eligible signals; it is net-of-cost and
constraint-respecting; NO LLM decides allocation/sizing; every portfolio is an immutable snapshot with
rationale. It reuses core_domain (portfolio context + shared kernel) and platform_validation,
references Signal/Risk by identity, enforces RB-12, and integrates with the Portfolio Registry.

Boundaries: NOT trade execution, NOT broker integration, NOT order management. No optimization
algorithms, no allocation mathematics, no persistence, no infrastructure, no API. The deterministic
optimizer plugs in behind the interface.

Modules: model, status, lifecycle, metadata, allocation, constraints, exposure, diversification,
construction, optimization, rebalancing, validation_coordination, approval, reporting,
registry_integration, management, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    allocation,
    approval,
    constraints,
    construction,
    diversification,
    errors,
    events,
    exposure,
    lifecycle,
    management,
    metadata,
    model,
    optimization,
    policies,
    rebalancing,
    registry_integration,
    reporting,
    repositories,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "metadata", "allocation", "constraints", "exposure",
    "diversification", "construction", "optimization", "rebalancing", "validation_coordination",
    "approval", "reporting", "registry_integration", "management", "policies", "specifications",
    "events", "errors", "repositories",
]
__version__ = "0.1.0"
