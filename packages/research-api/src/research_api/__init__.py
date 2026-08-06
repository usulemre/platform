"""research_api — the Research API application interface.

The institutional application interface through which human users, AI agents, and authorized services
interact with the research platform. It exposes research capabilities while enforcing governance,
workflows, authorization, and validation, and is the primary entry point for research operations.

Boundaries: it depends only on the platform contract kernel and the cross-cutting foundations
(validation, workflow-engine, security) by interface; controllers delegate business logic to
application services; it exposes no internal domain models (no dependency on core_domain). It contains
no HTTP framework code, no endpoints, no controller implementations, no business logic, no
infrastructure. Stateless and immutable.

Modules: core, query, routing, controller, validation_integration, authorization_integration,
workflow_integration, errors, and the per-domain controllers (research, experiments, datasets,
features, signals, strategies, portfolios, backtests, risk, validation, workflows, governance).
"""
from __future__ import annotations

from . import (
    authorization_integration,
    backtests,
    controller,
    core,
    datasets,
    errors,
    experiments,
    features,
    governance,
    portfolios,
    query,
    research,
    risk,
    routing,
    signals,
    strategies,
    validation,
    validation_integration,
    workflow_integration,
    workflows,
)

__all__ = [
    "core", "query", "routing", "controller", "validation_integration",
    "authorization_integration", "workflow_integration", "errors",
    "research", "experiments", "datasets", "features", "signals", "strategies", "portfolios",
    "backtests", "risk", "validation", "workflows", "governance",
]
__version__ = "0.1.0"
