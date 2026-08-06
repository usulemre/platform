"""platform_validation — the institutional STRUCTURAL validation framework.

Provides the common, reusable, composable validation abstractions used by every domain (datasets,
experiments, features, signals, strategies, portfolios, workflows, configuration, governance): the
validation model, context, policies, rules, specifications, results, reports, metadata, registry,
pipeline, and errors.

IT IS NOT STATISTICAL VALIDATION. Statistical significance, deflation, PBO, purged/embargoed CV,
one-shot holdout, replication, and capital-eligibility are the EXCLUSIVE domain of the deterministic
Validation engine (RB-01 · STAT, RB-04 · VAL, P2-*). This framework NEVER asserts significance
(AI-2) and issues NO verdict about whether an alpha is real. It is structural/rule-based only.

Boundaries: no validation algorithms, no statistical tests, no business rules, no persistence, no
infrastructure. Deterministic (no ambient time/RNG), composable, immutable, auditable.

Modules: model, context, policy, rule, specification, result, report, metadata, registry, pipeline,
errors.
"""
from __future__ import annotations

from . import (
    context,
    errors,
    metadata,
    model,
    pipeline,
    policy,
    registry,
    report,
    result,
    rule,
    specification,
)

__all__ = [
    "model", "context", "policy", "rule", "specification", "result", "report", "metadata",
    "registry", "pipeline", "errors",
]
__version__ = "0.1.0"
