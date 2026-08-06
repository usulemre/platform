# contracts · common (contract kernel)

> **Phase 1.2 — contract primitives.** Immutable, stdlib-only, dependency-free.

## Purpose

The shared kernel every contract module depends on: identity references (Id, VersionTag,
ContentHash, CorrelationId), the SchemaVersion (versionability), the authority enums, the
ContractMeta envelope (identity + version + causation + actor + supplied time), the base message
markers (Command, Query, Event, Request, Response, Dto), the canonical ErrorContract + ErrorCategory,
the structural ValidationContract, and the base Policy/Specification/Repository/Service patterns.

## Boundaries

Depends on nothing (innermost, dependency-free). All contract modules depend on it. Immutable;
deterministic (time supplied on the envelope, never read).

## Related Governance Documents

CLAUDE.md (CP-2/4/5/6/7/8, NM-2, PIT-1..4, CS-3, VER-1/2); Architecture V2 §5.10; IMP-10/11;
RB-20 · CODE; Technology Decision Record §11 (API strategy).
