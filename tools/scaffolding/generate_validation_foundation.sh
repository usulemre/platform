#!/usr/bin/env bash
#
# generate_validation_foundation.sh — Phase 1.6 Validation Foundation generator.
#
# Governed by: CLAUDE.md (AI-2 no LLM significance, DE-1/4 deterministic engines, CP-6/7, CS-3);
#              Architecture V2 §5.6, §5.10; Implementation Roadmap Phase 1; RB-20 · CODE.
#
# Emits the institutional STRUCTURAL validation framework under packages/validation as
# `platform_validation`: validation model, context, policy, rule, specification, result, report,
# metadata, registry, pipeline, and errors. This is the common, reusable, composable validation
# ARCHITECTURE used across datasets/experiments/features/signals/strategies/portfolios/workflows/
# governance.
#
# IT IS NOT STATISTICAL VALIDATION. Statistical significance, deflation, PBO, holdout, replication,
# and capital-eligibility remain the exclusive domain of the deterministic Validation engine
# (RB-01 · STAT, RB-04 · VAL, P2-*). This layer NEVER asserts significance (AI-2) and issues NO
# verdicts about real vs. spurious alpha. It contains NO validation algorithms, NO statistical
# tests, NO business rules, NO persistence, NO infrastructure. Deterministic, composable,
# technology-independent, immutable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/validation"
SRC="$PKG/src/platform_validation"
cd "$ROOT"

vreadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 dependencies 6 relationships 7 gov
  cat > "$1/README.md" <<EOF
# validation · $2

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose
$3

## Responsibilities
$4

## Dependencies
$5

## Relationships
$6

## Related Governance Documents
$7
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# validation — the institutional STRUCTURAL validation framework abstractions (Phase 1.6).
# Standard library + the platform contract kernel only. NOT statistical validation.
[project]
name = "platform-validation"
version = "0.1.0"
description = "Structural validation framework: model, rules, specifications, results, pipeline, registry."
requires-python = ">=3.12"
dependencies = ["platform-contracts"]   # depends on the stable contract kernel only (IMP-10)

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_validation"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# validation — implemented in Phase 1.6

This package now contains the Validation Foundation (the `platform_validation` package): the common,
composable STRUCTURAL validation framework (model, context, policy, rule, specification, result,
report, metadata, registry, pipeline, errors). It is NOT statistical validation — statistical
significance and capital-eligibility remain the deterministic Validation engine's domain (RB-01/04,
P2-*). Validation algorithms, statistical tests, business rules, persistence, and infrastructure
remain forbidden here.
MD

cat > "$SRC/__init__.py" <<'PY'
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
PY

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Model — the taxonomy, lifecycle, modes, and the Validation/Validator core (data + interface).

Structural validation only; this model asserts NO statistical significance (AI-2).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import TYPE_CHECKING, Protocol, TypeVar

from platform_contracts.common import Id

if TYPE_CHECKING:  # imported for typing only — avoids any runtime import cycle
    from platform_validation.context import ValidationContext
    from platform_validation.result import ValidationResult


class ValidationCategory(Enum):
    """The institutional validation taxonomy (one category per domain that validates structurally)."""

    DATASET = "dataset"
    RESEARCH = "research"
    EXPERIMENT = "experiment"
    FEATURE = "feature"
    SIGNAL = "signal"
    STRATEGY = "strategy"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    WORKFLOW = "workflow"
    CONFIGURATION = "configuration"
    GOVERNANCE = "governance"


class ValidationLifecycle(Enum):
    """The canonical validation lifecycle."""

    CREATED = "created"
    PRE_VALIDATION = "pre_validation"
    VALIDATING = "validating"
    PASSED = "passed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ValidationMode(Enum):
    """Validation modes supported by the framework (composability)."""

    FULL = "full"
    PARTIAL = "partial"
    INCREMENTAL = "incremental"
    COMPOSITE = "composite"
    REVALIDATION = "revalidation"


class Severity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ValidationStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    PARTIAL = "partial"
    SKIPPED = "skipped"


L = ValidationLifecycle

#: The canonical lifecycle transitions (revalidation re-enters PRE_VALIDATION).
CANONICAL_TRANSITIONS: tuple[tuple[ValidationLifecycle, ValidationLifecycle], ...] = (
    (L.CREATED, L.PRE_VALIDATION),
    (L.PRE_VALIDATION, L.VALIDATING),
    (L.VALIDATING, L.PASSED),
    (L.VALIDATING, L.FAILED),
    (L.PASSED, L.ARCHIVED),
    (L.FAILED, L.ARCHIVED),
    # revalidation
    (L.PASSED, L.PRE_VALIDATION),
    (L.FAILED, L.PRE_VALIDATION),
)

TSubject = TypeVar("TSubject", contravariant=True)


@dataclass(frozen=True, slots=True)
class Validation:
    """An immutable record of one structural validation instance over a subject."""

    validation_id: Id
    category: ValidationCategory
    mode: ValidationMode
    lifecycle: ValidationLifecycle


class Validator(Protocol[TSubject]):
    """A deterministic, structural validator over a subject. Interface only.

    Composed from rules/specifications; behavior lives in an outer engine. It performs NO statistical
    test and asserts NO significance (AI-2, DE-4); a FAILED result is a structural outcome, not a
    scientific verdict.
    """

    def validate(self, subject: TSubject, context: "ValidationContext") -> "ValidationResult": ...
PY
vreadme "$D" "model" \
"Define the validation taxonomy (ValidationCategory, 11 categories), the canonical ValidationLifecycle, ValidationMode (full/partial/incremental/composite/revalidation), Severity, ValidationStatus, the Validation record, and the Validator interface." \
"Provide the core structural-validation model and interface; assert NO statistical significance; hold no logic." \
"platform_contracts.common (Id); standard library." \
"Consumed by every other validation module; distinct from the deterministic statistical Validation engine." \
"CLAUDE.md (AI-2, DE-1/4, VS-1); Architecture V2 §5.6, §5.10; RB-01 · STAT (separation); RB-20 · CODE."

# ===========================================================================
# context
# ===========================================================================
D="$SRC/context"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Context — the immutable context for a validation run (deterministic)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import ActorRef, CorrelationId, Id

from platform_validation.model import ValidationCategory


@dataclass(frozen=True, slots=True)
class ValidationContext:
    """Immutable context for a validation run.

    ``as_of`` is a supplied ISO-8601 knowledge-time for any point-in-time read a validator performs
    (PIT-1); the framework reads no ambient time (CS-3).
    """

    subject_id: Id
    category: ValidationCategory
    actor: ActorRef
    correlation_id: CorrelationId
    as_of: str | None
PY
vreadme "$D" "context" \
"Define ValidationContext: the immutable, deterministic context (subject, category, actor, correlation, as-of) for a validation run." \
"Carry validation context by value; supply the as-of boundary for PIT reads; read no ambient time." \
"platform_contracts.common (Id, ActorRef, CorrelationId); model (ValidationCategory)." \
"Consumed by validators and the pipeline." \
"CLAUDE.md (PIT-1, CS-3, CP-7); Architecture V2 §5.10; RB-08 · PIT."

# ===========================================================================
# result
# ===========================================================================
D="$SRC/result"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Result — the immutable success/failure records of a structural validation (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Violation  # reuse the atomic structural violation

from platform_validation.model import Severity, ValidationStatus


@dataclass(frozen=True, slots=True)
class ValidationSuccess:
    """A rule that was satisfied."""

    rule: str


@dataclass(frozen=True, slots=True)
class ValidationFailure:
    """A rule that was violated (a structural outcome, NOT a statistical verdict)."""

    rule: str
    severity: Severity
    violation: Violation


@dataclass(frozen=True, slots=True)
class ValidationResult:
    """The immutable outcome of a structural validation: status + successes + failures."""

    status: ValidationStatus
    successes: tuple[ValidationSuccess, ...]
    failures: tuple[ValidationFailure, ...]
PY
vreadme "$D" "result" \
"Define ValidationResult, ValidationSuccess, and ValidationFailure: the immutable outcome of a structural validation." \
"Represent validation outcomes as immutable data (status + successes + failures); a failure is structural, not a scientific verdict." \
"platform_contracts.common (Violation); model (Severity, ValidationStatus)." \
"Produced by validators; aggregated by report; consumed by pipeline." \
"CLAUDE.md (CP-2/7, AI-2); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# rule
# ===========================================================================
D="$SRC/rule"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Rule — a named, deterministic, versioned rule and its evaluator interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, TypeVar

from platform_validation.model import Severity


@dataclass(frozen=True, slots=True)
class ValidationRule:
    """A named, deterministic, versioned structural rule (the logic lives in an outer engine)."""

    rule_id: str
    description: str
    severity: Severity


TSubject = TypeVar("TSubject", contravariant=True)


class RuleEvaluator(Protocol[TSubject]):
    """Evaluates one rule against a subject deterministically. Interface only — no logic here."""

    def evaluate(self, subject: TSubject) -> bool: ...
PY
vreadme "$D" "rule" \
"Define ValidationRule (a named, versioned, severity-bearing rule) and the RuleEvaluator interface." \
"Represent structural rules as immutable data with a deterministic evaluator interface; hold no rule logic (that lives in an outer engine)." \
"model (Severity); standard library." \
"Composed by specifications and the pipeline." \
"CLAUDE.md (DE-1/2, CS-2); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# specification
# ===========================================================================
D="$SRC/specification"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Specification — composable deterministic predicates (DE-1). Interfaces + data."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol, TypeVar

TCandidate = TypeVar("TCandidate", contravariant=True)


class ValidationSpecification(Protocol[TCandidate]):
    """A composable, deterministic predicate over a candidate. Interface only — no logic here."""

    def is_satisfied_by(self, candidate: TCandidate) -> bool: ...


class CompositeKind(Enum):
    AND = "and"
    OR = "or"
    NOT = "not"


@dataclass(frozen=True, slots=True)
class CompositeSpecification:
    """A declarative composition of named specifications (composability).

    ``operands`` reference specifications by name; this is DATA describing composition, not logic.
    """

    kind: CompositeKind
    operands: tuple[str, ...]
PY
vreadme "$D" "specification" \
"Define ValidationSpecification (a composable predicate interface) and CompositeSpecification (declarative AND/OR/NOT composition)." \
"Express reusable, composable structural predicates; describe composition declaratively; hold no logic." \
"Standard library only." \
"Composed with rules by validators and the pipeline (composability is a core quality goal)." \
"CLAUDE.md (DE-1, SE-3); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# policy
# ===========================================================================
D="$SRC/policy"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Policy — deterministic policy INTERFACES governing how validation runs (no logic)."""
from __future__ import annotations

from typing import Protocol

from platform_validation.model import ValidationMode


class ValidationPolicy(Protocol):
    """Marker for a deterministic, versioned validation policy."""

    ...


class FailureHandlingPolicy(Protocol):
    """Governs fail-fast vs. collect-all behavior. Interface only."""

    def fail_fast(self) -> bool: ...


class RevalidationPolicy(Protocol):
    """Governs when revalidation is required (e.g. on a lineage defect, CP-6). Interface only."""

    def requires_revalidation(self, mode: ValidationMode) -> bool: ...
PY
vreadme "$D" "policy" \
"Define the deterministic validation policy interfaces: ValidationPolicy, FailureHandlingPolicy, RevalidationPolicy." \
"Express how validation runs (fail-fast vs collect-all, when to revalidate) as interfaces; hold no logic." \
"model (ValidationMode); standard library." \
"Applied by the pipeline; supports revalidation/partial/incremental/composite modes." \
"CLAUDE.md (DE-1, CP-6, DP-2); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Metadata — ownership, category, version, lifecycle, and provenance (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion

from platform_validation.model import ValidationCategory, ValidationLifecycle


@dataclass(frozen=True, slots=True)
class ValidationMetadata:
    """Immutable metadata for a validator/validation (auditable, versioned)."""

    validator_id: str
    category: ValidationCategory
    version: SchemaVersion
    lifecycle: ValidationLifecycle
    owner: str
    created_at: str  # supplied ISO-8601 (CS-3)
PY
vreadme "$D" "metadata" \
"Define ValidationMetadata: validator id, category, version, lifecycle, owner, and supplied creation time." \
"Carry immutable, auditable, versioned validation metadata; data only." \
"platform_contracts.common (SchemaVersion); model (ValidationCategory, ValidationLifecycle)." \
"Consumed by report and registry." \
"CLAUDE.md (CP-7, VER-1, CS-3); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# report
# ===========================================================================
D="$SRC/report"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Report — the immutable, auditable aggregation of validation results (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_validation.metadata import ValidationMetadata
from platform_validation.result import ValidationResult


@dataclass(frozen=True, slots=True)
class ReportSummary:
    """A count summary over the report's results."""

    total: int
    passed: int
    failed: int


@dataclass(frozen=True, slots=True)
class ValidationReport:
    """An immutable, auditable report aggregating validation results (CP-7)."""

    metadata: ValidationMetadata
    results: tuple[ValidationResult, ...]
    summary: ReportSummary
PY
vreadme "$D" "report" \
"Define ValidationReport and ReportSummary: the immutable, auditable aggregation of validation results." \
"Aggregate results with metadata and a summary as immutable data; hold no logic." \
"result (ValidationResult); metadata (ValidationMetadata)." \
"Produced by the pipeline; consumed by audit/governance and human review." \
"CLAUDE.md (CP-7, EXP-2); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# registry
# ===========================================================================
D="$SRC/registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Registry — the append-only registry INTERFACE for validators (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id

from platform_validation.metadata import ValidationMetadata
from platform_validation.model import ValidationCategory


@dataclass(frozen=True, slots=True)
class ValidationRecord:
    """An immutable registry record of a validator's existence and category."""

    validator_id: Id
    category: ValidationCategory


class ValidationRegistry(Protocol):
    """Append-only registry of validators (register-before-use). Interface only — no persistence."""

    def get(self, validator_id: Id) -> ValidationMetadata: ...
    def register(self, metadata: ValidationMetadata) -> None: ...
PY
vreadme "$D" "registry" \
"Define ValidationRecord and the ValidationRegistry interface: the append-only inventory of validators." \
"Express register-before-use validator existence as an interface; hold no persistence." \
"platform_contracts.common (Id); metadata; model (ValidationCategory)." \
"Consumed by the pipeline and governance/audit." \
"CLAUDE.md (CP-7, DE-2); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# pipeline
# ===========================================================================
D="$SRC/pipeline"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Pipeline — the composable pipeline spec and runner INTERFACE (composability).

Supports composite, incremental, and partial validation by composing stages. No orchestration or
logic here; a deterministic engine runs the pipeline.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_validation.context import ValidationContext
from platform_validation.result import ValidationResult


class PipelineMode(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"


@dataclass(frozen=True, slots=True)
class PipelineStage:
    """One stage of a validation pipeline, referencing a validator by id."""

    name: str
    validator_id: str
    optional: bool  # supports partial validation


@dataclass(frozen=True, slots=True)
class ValidationPipelineSpec:
    """A declarative composition of validation stages (composite/incremental/partial)."""

    stages: tuple[PipelineStage, ...]
    mode: PipelineMode


class ValidationPipeline(Protocol):
    """Runs a composed pipeline of validators deterministically. Interface only — no logic here."""

    def run(self, spec: ValidationPipelineSpec, context: ValidationContext) -> ValidationResult: ...
PY
vreadme "$D" "pipeline" \
"Define ValidationPipelineSpec, PipelineStage, PipelineMode, and the ValidationPipeline interface: composable validation supporting composite/incremental/partial modes." \
"Express validation as a declarative, composable pipeline of stages; hold no orchestration or logic." \
"context (ValidationContext); result (ValidationResult); standard library." \
"Runs registered validators; enables revalidation/partial/incremental/composite validation." \
"CLAUDE.md (DE-1, SE-3, RE-1); Architecture V2 §5.10; RB-20 · CODE."

# ===========================================================================
# errors
# ===========================================================================
D="$SRC/errors"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Validation Errors — framework-level error definitions (distinct from a validation FAILURE)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ValidationErrorCode(Enum):
    INVALID_CONTEXT = "validation.invalid_context"
    UNREGISTERED_VALIDATOR = "validation.unregistered_validator"
    PIPELINE_STAGE_FAILED = "validation.pipeline_stage_failed"
    ILLEGAL_LIFECYCLE_TRANSITION = "validation.illegal_lifecycle_transition"
    SPECIFICATION_UNSATISFIED = "validation.specification_unsatisfied"


class ValidationFrameworkError(Exception):
    """Base for validation-FRAMEWORK faults (misuse), NOT a domain/statistical verdict.

    A validation FAILURE (see result.ValidationFailure) is a legitimate structural outcome; a
    framework error means the validation could not run correctly.
    """


@dataclass(frozen=True, slots=True)
class ValidationError:
    """A structured, immutable framework error (a fact)."""

    code: ValidationErrorCode
    detail: str
PY
vreadme "$D" "errors" \
"Define ValidationErrorCode, ValidationFrameworkError (base), and ValidationError: framework-level errors distinct from a validation failure." \
"Express framework faults (misuse, illegal transitions) as errors; a validation FAILURE is a legitimate outcome, not an error." \
"Standard library only." \
"Used across the framework modules." \
"CLAUDE.md (CP-7, DE-2); Architecture V2 §5.10; RB-20 · CODE."

echo "Validation Foundation generated."
