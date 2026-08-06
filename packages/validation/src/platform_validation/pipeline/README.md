# validation · pipeline

> **Phase 1.6 Validation Foundation — abstractions only.** Deterministic, composable, technology-
> and framework-independent. Structural/rule-based validation ONLY — never statistical. No
> validation algorithms, no statistical tests, no business rules, no persistence, no infrastructure.

## Purpose

Define ValidationPipelineSpec, PipelineStage, PipelineMode, and the ValidationPipeline interface: composable validation supporting composite/incremental/partial modes.

## Responsibilities

Express validation as a declarative, composable pipeline of stages; hold no orchestration or logic.

## Dependencies

context (ValidationContext); result (ValidationResult); standard library.

## Relationships

Runs registered validators; enables revalidation/partial/incremental/composite validation.

## Related Governance Documents

CLAUDE.md (DE-1, SE-3, RE-1); Architecture V2 §5.10; RB-20 · CODE.
