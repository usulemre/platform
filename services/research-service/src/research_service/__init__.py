"""research_service — the Research Service: governs the quantitative research lifecycle.

Transforms research ideas into structured, traceable, reproducible research initiatives and
orchestrates their lifecycle across datasets, features, experiments, and validation workflows (by
identity/dependency, never by reaching into them). It reuses the Phase-1 foundations (core_domain
research context + shared kernel, platform_contracts).

Authority boundary (CP-5, AI-2, AD-3): the Research Service PROPOSES and RECORDS; it NEVER
adjudicates statistical significance or acceptance (that is the deterministic Validation engine),
and it NEVER observes validation/OOS outcomes (the isolation barrier, P2-07). Register-before-run
and pre-registration lock are enforced (SM-1/2); negative results are first-class (SM-4).

Boundaries: no statistical algorithms, no backtesting, no AI, no persistence, no infrastructure, no
API, no UI.

Modules: model, lifecycle, status, metadata, ownership, classification, dependencies, registration,
management, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    classification,
    dependencies,
    errors,
    events,
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
)

__all__ = [
    "model", "lifecycle", "status", "metadata", "ownership", "classification", "dependencies",
    "registration", "management", "policies", "specifications", "events", "errors", "repositories",
]
__version__ = "0.1.0"
