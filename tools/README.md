# tools/ — Developer & Governance Tooling

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose

Supporting tooling for developers and governance: scaffolding generators, contract/reference
linters, and CI gate helpers that enforce the governance gates (RB-20..27) technology-
independently. Tools support the build; they are not part of the runtime.

## Scope

Build-time and governance tooling. The Phase 0 scaffolding generator lives here.

## Members

- `scaffolding/` — the Phase 0 repository-foundation generator (this directory's `generate_foundation.sh`).
- `ci/` — technology-independent descriptions of the CI governance gates.

## Allowed Contents

Tool skeletons and generators; gate descriptions; documentation.

## Forbidden Contents

Runtime business logic; secrets; tools that can bypass or disable a governance gate.

## Ownership

Accountable role: PE. Architecture owner: ARB.

## Dependencies

Standalone; may read the governance corpus and repository structure.

## Related Governance Documents

CLAUDE.md (CP-1, CR-1..4); RB-20..27; Implementation Roadmap Phase 0 (CI gates).
