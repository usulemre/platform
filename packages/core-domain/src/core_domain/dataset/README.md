# core-domain · Dataset domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model certified, point-in-time-correct, provenance-bearing data and the vintage/restatement model that research stands on.

## Responsibilities

Model datasets, vintages, certification status, survivorship-safe universes, and as-of symbology; require provenance on every dataset.

## Boundaries

The As-Of Gateway is the sole read path and fails closed without an as_of; the domain models this port but does not persist or read data.

## Relationships

Feeds Feature and every deterministic engine via the As-Of Gateway; the OOS partition is sealed from research/AI. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

DatasetRepository, VintageRepository (append-only); AsOfGateway (as-of read port); CertificationService; events DatasetRegistered, DatasetValidated, VintageRecorded.

## Forbidden Responsibilities

MUST NOT serve non-as-of or uncertified data; MUST NOT overwrite a vintage; MUST NOT expose OOS to research/AI.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (DI-1..3, DP-1..3, PIT-1..4); Architecture V2 §5.8, §6.4; RB-06/07 · DATA; RB-08 · PIT; Dataset Governance; P1-01.
