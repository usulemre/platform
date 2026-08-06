"""risk_service — the deterministic research-side Risk Engine.

Evaluates research outputs against institutional risk policies before they may progress to signal
generation. It is the authoritative source of truth for quantitative risk assessment within the
research platform.

Authority (RS-1/2, CP-5, AI-1): risk oversight is INDEPENDENT of research/portfolio; risk verdicts
are DETERMINISTIC, versioned, and formally testable; NO AI decides risk. It reuses core_domain (risk
context + shared kernel) and platform_validation, references Backtesting evidence by identity, and
enforces the Risk Management governance (RB-13).

Boundaries: NOT portfolio optimization, NOT production execution, NOT broker risk. No numerical risk
algorithms, no VaR calculations, no stress-testing algorithms, no execution authority, no broker
integration, no persistence, no infrastructure, no API. Numerical computation plugs in behind the
interfaces as deterministic, golden-tested engines.

Modules: model, status, lifecycle, classification, constraints, limits, exposure, policies,
assessment, pipeline, validation_coordination, reporting, review, approval, management,
specifications, metadata, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    approval,
    assessment,
    classification,
    constraints,
    errors,
    events,
    exposure,
    lifecycle,
    limits,
    management,
    metadata,
    model,
    pipeline,
    policies,
    reporting,
    repositories,
    review,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "classification", "constraints", "limits", "exposure",
    "policies", "assessment", "pipeline", "validation_coordination", "reporting", "review",
    "approval", "management", "specifications", "metadata", "events", "errors", "repositories",
]
__version__ = "0.1.0"
