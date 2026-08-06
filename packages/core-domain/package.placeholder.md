# core-domain — implemented in Phase 1.1

This package now contains the Core Domain Foundation (pure domain model). See README.md and the
per-domain modules under `src/core_domain/`. Business logic is still forbidden here; it lives in the
services and deterministic engines that consume this model.
