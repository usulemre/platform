"""Validation Engine — the deterministic runner behind the ``ValidationPipeline`` interface (VS-1).

The third deterministic engine in the platform. It fulfils ``platform_validation.pipeline``'s
``ValidationPipeline`` Protocol (CS-1) with real, golden-tested composition logic, kept in a
separate module from the interface-only skeleton (SE-4, RO-4).

Constitutional stance:

* **Structural only, never statistical (AI-2, DE-4).** A ``FAILED`` result is a structural outcome
  (a rule was violated), never an assertion of significance. No LLM and no statistics live here.
* **Deterministic (DE-2, VS-1).** Stages execute in declared order; the aggregate status is a pure
  function of the stage results, so a ``PARALLEL`` spec yields the same verdict as ``SEQUENTIAL``.
* **Register-before-use.** A required stage whose validator is not registered is a structural
  failure, not a silent skip — the pipeline fails closed.
* **Point-in-time (PIT-1).** Stage validators receive the immutable ``ValidationContext`` (carrying
  ``as_of``) and read only through it; the engine reads no ambient time (CS-3).
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Protocol

from platform_contracts.common import Violation

from platform_validation.context import ValidationContext
from platform_validation.model import Severity, ValidationStatus
from platform_validation.pipeline import ValidationPipelineSpec
from platform_validation.result import ValidationFailure, ValidationResult, ValidationSuccess


class StageValidator(Protocol):
    """A validator bound to its subject source, evaluated from the context (PIT-1). Interface only."""

    def validate(self, context: ValidationContext) -> ValidationResult: ...


def _stage_failed(result: ValidationResult) -> bool:
    return result.status is ValidationStatus.FAILED or bool(result.failures)


def _is_incomplete(result: ValidationResult) -> bool:
    return result.status in (ValidationStatus.PARTIAL, ValidationStatus.SKIPPED)


class DeterministicValidationPipeline:
    """Concrete ``ValidationPipeline``: runs registered validators and aggregates one result.

    ``validators`` maps a stage's ``validator_id`` to the bound validator. Replaceable behind the
    Protocol without touching consumers (SE-3).
    """

    __slots__ = ("_validators",)

    def __init__(self, validators: Mapping[str, StageValidator]) -> None:
        self._validators = validators

    def run(
        self, spec: ValidationPipelineSpec, context: ValidationContext
    ) -> ValidationResult:
        successes: list[ValidationSuccess] = []
        failures: list[ValidationFailure] = []
        required_failed = False
        incomplete = False

        for stage in spec.stages:
            validator = self._validators.get(stage.validator_id)
            if validator is None:
                if stage.optional:
                    incomplete = True  # an optional stage we could not run -> PARTIAL
                    continue
                # A required validator that is not registered fails the pipeline closed.
                required_failed = True
                failures.append(
                    ValidationFailure(
                        rule=stage.name,
                        severity=Severity.ERROR,
                        violation=Violation(
                            field=stage.validator_id,
                            rule="validator_registered",
                            detail="required validator is not registered (register-before-use)",
                        ),
                    )
                )
                continue

            result = validator.validate(context)
            successes.extend(result.successes)
            failures.extend(result.failures)
            if _stage_failed(result):
                if stage.optional:
                    incomplete = True
                else:
                    required_failed = True
            elif _is_incomplete(result):
                incomplete = True

        if required_failed:
            status = ValidationStatus.FAILED
        elif incomplete:
            status = ValidationStatus.PARTIAL
        else:
            status = ValidationStatus.PASSED

        return ValidationResult(
            status=status, successes=tuple(successes), failures=tuple(failures)
        )


__all__ = ["DeterministicValidationPipeline", "StageValidator"]
