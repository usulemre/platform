# infrastructure/ — Infrastructure Definitions

> **Phase 0 scaffolding placeholder.** Structure only — technology-independent.

## Purpose

Technology-independent definitions of the platform's runtime substrate: the message bus
(partitioned topics + ACLs), artifact/temporal stores, identity, and the reproducibility/
observability backbone — described as capabilities behind contracts, never as a specific vendor
(AV2-12, IMP-9).

## Scope

Infrastructure capability definitions and topology, vendor-neutral. Distinct from
`deployment/` (release/rollout) and `configs/` (values).

## Allowed Contents

Capability/topology definition skeletons (bus topics + ACLs, stores, identity/RBAC);
documentation.

## Forbidden Contents

Vendor-locked core logic (AV2-12); secrets; a message bus without partitioning/ACLs (SC-3);
"immutable forever, hot forever" storage without lifecycle (AP-8, SC-2).

## Ownership

Accountable role: HSRE. Architecture owner: ARB.

## Dependencies

Underpins all layers via the cross-cutting spines; depends on nothing above it. Built in
**Phase 1** (substrate), extended per phase.

## Related Governance Documents

CLAUDE.md (SC-1..4, AV2-12); Architecture V2 §5.10, §10; P5-04; Implementation Roadmap Phase 1.
