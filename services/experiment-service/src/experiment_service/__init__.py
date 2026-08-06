"""experiment_service — the Experiment Service: governs the lifecycle of research experiments.

Transforms research initiatives into reproducible, auditable, validated experiments and orchestrates
them across Research, Datasets, Features, Validation, and Backtesting (by identity/dependency). It
reuses the Phase-1/2 foundations (core_domain experiment context + shared kernel, platform_validation).

Authority boundary (CP-5, AI-2, AD-3): the Experiment Service ORCHESTRATES and RECORDS; it NEVER runs
statistics or backtests, NEVER adjudicates significance, and NEVER observes validation/OOS outcomes
(the isolation barrier, P2-07). Every experiment is registered with an immutable manifest before
execution (SM-5, EX-1) and is reproducible (EX-2/3, RP-1); every trial is counted (EX-4).

Boundaries: no statistical algorithms, no backtesting execution, no persistence, no infrastructure, no API.

Modules: model, status, lifecycle, configuration, metadata, ownership, classification, dependencies,
registration, execution_coordination, validation_coordination, archival, management, policies,
specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    archival,
    classification,
    configuration,
    dependencies,
    errors,
    events,
    execution_coordination,
    lifecycle,
    management,
    metadata,
    model,
    ownership,
    policies,
    registration,
    repositories,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "configuration", "metadata", "ownership", "classification",
    "dependencies", "registration", "execution_coordination", "validation_coordination", "archival",
    "management", "policies", "specifications", "events", "errors", "repositories",
]
__version__ = "0.1.0"
