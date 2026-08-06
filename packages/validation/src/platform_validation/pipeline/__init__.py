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
