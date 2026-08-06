# infrastructure/bus

> **Phase 0 scaffolding placeholder.** Technology-independent.

The message bus definition: domain-partitioned topics with **ACLs** enforcing the
generator-vs-validator isolation barrier (P2-07, P5-04). Agents communicate only via the bus and
immutable artifact references (AC-1). Governed by SC-3; Architecture V2 §5.2/§5.10.
