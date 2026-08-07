"""Golden-set tests for the deterministic Validation Pipeline engine (VS-1, CS-2)."""
from __future__ import annotations

from platform_contracts.common import (
    ActorKind,
    ActorRef,
    AuthorityLevel,
    CorrelationId,
    Id,
    Violation,
)
from platform_validation.context import ValidationContext
from platform_validation.engine import DeterministicValidationPipeline
from platform_validation.model import Severity, ValidationCategory, ValidationStatus
from platform_validation.pipeline import PipelineMode, PipelineStage, ValidationPipelineSpec
from platform_validation.result import ValidationFailure, ValidationResult, ValidationSuccess


class _CannedValidator:
    """A stage validator that returns a fixed result (stands in for a real bound validator)."""

    def __init__(self, result: ValidationResult) -> None:
        self._result = result

    def validate(self, context: ValidationContext) -> ValidationResult:
        return self._result


def _passed(rule: str) -> ValidationResult:
    return ValidationResult(ValidationStatus.PASSED, (ValidationSuccess(rule),), ())


def _failed(rule: str) -> ValidationResult:
    return ValidationResult(
        ValidationStatus.FAILED,
        (),
        (ValidationFailure(rule, Severity.ERROR, Violation(field=rule, rule=rule, detail="x")),),
    )


def _context() -> ValidationContext:
    return ValidationContext(
        subject_id=Id("SUBJ1"),
        category=ValidationCategory.FEATURE,
        actor=ActorRef("engine", ActorKind.DETERMINISTIC_ENGINE, AuthorityLevel.DECIDE),
        correlation_id=CorrelationId("corr-1"),
        as_of="2024-06-01T00:00:00Z",
    )


def _spec(*stages: PipelineStage, mode: PipelineMode = PipelineMode.SEQUENTIAL) -> ValidationPipelineSpec:
    return ValidationPipelineSpec(stages=stages, mode=mode)


def test_all_stages_pass_is_passed() -> None:
    pipe = DeterministicValidationPipeline(
        {"leakage": _CannedValidator(_passed("leakage")), "schema": _CannedValidator(_passed("schema"))}
    )
    spec = _spec(
        PipelineStage("leakage-check", "leakage", optional=False),
        PipelineStage("schema-check", "schema", optional=False),
    )
    result = pipe.run(spec, _context())
    assert result.status is ValidationStatus.PASSED
    assert {s.rule for s in result.successes} == {"leakage", "schema"}
    assert result.failures == ()


def test_required_stage_failure_fails_pipeline() -> None:
    """VS-2: a required leakage-harness failure must fail the whole pipeline."""
    pipe = DeterministicValidationPipeline(
        {"leakage": _CannedValidator(_failed("leakage")), "schema": _CannedValidator(_passed("schema"))}
    )
    spec = _spec(
        PipelineStage("leakage-check", "leakage", optional=False),
        PipelineStage("schema-check", "schema", optional=False),
    )
    result = pipe.run(spec, _context())
    assert result.status is ValidationStatus.FAILED
    assert any(f.rule == "leakage" for f in result.failures)


def test_optional_stage_failure_is_partial_not_failed() -> None:
    pipe = DeterministicValidationPipeline(
        {"core": _CannedValidator(_passed("core")), "extra": _CannedValidator(_failed("extra"))}
    )
    spec = _spec(
        PipelineStage("core-check", "core", optional=False),
        PipelineStage("extra-check", "extra", optional=True),
    )
    result = pipe.run(spec, _context())
    assert result.status is ValidationStatus.PARTIAL


def test_missing_required_validator_fails_closed() -> None:
    """Register-before-use: an unregistered required validator is a structural failure."""
    pipe = DeterministicValidationPipeline({})
    spec = _spec(PipelineStage("core-check", "core", optional=False))
    result = pipe.run(spec, _context())
    assert result.status is ValidationStatus.FAILED
    assert result.failures[0].violation.rule == "validator_registered"


def test_missing_optional_validator_is_partial() -> None:
    pipe = DeterministicValidationPipeline({"core": _CannedValidator(_passed("core"))})
    spec = _spec(
        PipelineStage("core-check", "core", optional=False),
        PipelineStage("extra-check", "extra", optional=True),
    )
    result = pipe.run(spec, _context())
    assert result.status is ValidationStatus.PARTIAL


def test_parallel_mode_yields_same_verdict_as_sequential() -> None:
    """DE-2: the aggregate verdict is order/mode independent."""
    validators = {"a": _CannedValidator(_passed("a")), "b": _CannedValidator(_failed("b"))}
    stages = (
        PipelineStage("a-check", "a", optional=False),
        PipelineStage("b-check", "b", optional=False),
    )
    seq = DeterministicValidationPipeline(validators).run(_spec(*stages, mode=PipelineMode.SEQUENTIAL), _context())
    par = DeterministicValidationPipeline(validators).run(_spec(*stages, mode=PipelineMode.PARALLEL), _context())
    assert seq.status is par.status is ValidationStatus.FAILED
