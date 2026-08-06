"""signal_service — the deterministic Signal Engine.

Transforms validated research outputs into standardized investment signals. Consumes validated
Features, Experiment evidence, Backtesting results, and APPROVED Risk assessments; it is the
institutional source of truth for all investment signals.

Authority (AD-1/3, RS-1, CP-5, AI-1): it decides DETERMINISTICALLY; it is net-of-cost; it never
observes per-candidate validation/OOS outcomes (the isolation barrier, P2-07); and it NEVER activates
a signal without a mandatory Risk approval. It reuses core_domain (signal context + shared kernel) and
platform_validation, references upstream sources by identity, and integrates with the Signal Registry.

Boundaries: NOT portfolio construction, NOT execution, NOT machine learning. No signal-generation
algorithms, no ranking algorithms, no scoring formulas, no persistence, no infrastructure, no API. The
deterministic scoring/ranking engines plug in behind the interfaces.

Modules: model, status, lifecycle, classification, decision, scoring, ranking, dependencies,
generation, validation_coordination, approval, registry_integration, metadata, governance, management,
policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    approval,
    classification,
    decision,
    dependencies,
    errors,
    events,
    generation,
    governance,
    lifecycle,
    management,
    metadata,
    model,
    policies,
    ranking,
    registry_integration,
    repositories,
    scoring,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "classification", "decision", "scoring", "ranking",
    "dependencies", "generation", "validation_coordination", "approval", "registry_integration",
    "metadata", "governance", "management", "policies", "specifications", "events", "errors",
    "repositories",
]
__version__ = "0.1.0"
