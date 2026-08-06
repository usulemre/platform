# Rulebooks

This directory holds the **Rulebooks** — Tier 3 of the repository's authority hierarchy. Rulebooks are the institutional governance layer that sits directly beneath the Architecture Documents and above Agent Contracts.

- **Constitution:** [`/CLAUDE.md`](../../CLAUDE.md) — supreme authority (Tier 1).
- **Architecture Canon:** [`../architecture/`](../architecture/) — the system of record (Tier 2).
- **This layer:** the Rulebook Framework and the individual rulebooks it governs (Tier 3).
- **Framework (start here):** [`rulebook_framework.md`](./rulebook_framework.md) — the complete catalog, ownership, dependency graph, mandatory structure, and anti-duplication map.

> This README explains **why** rulebooks exist and **how** they are created, evolved, versioned, and related to higher tiers. It is a process document. The authoritative catalog and specifications live in the Framework, not here.

---

## Why Rulebooks Exist

The Constitution (`CLAUDE.md`) defines **immutable principles** — what must always be true (e.g., "no look-ahead bias", "LLMs must never validate significance", "every experiment must be reproducible"). Principles are deliberately general so they can survive ten years of change.

But a principle is not directly executable. "No look-ahead bias" does not tell a data engineer which query pattern is forbidden, or tell CI what to reject. **Rulebooks bridge that gap.** They translate each constitutional principle into concrete, domain-specific, testable rules that humans, AI agents, and CI can actually enforce.

The division of labor across the hierarchy:

| Tier | Document           | Answers the question                                      |
| ---- | ------------------ | --------------------------------------------------------- |
| 1    | Constitution       | _What must always be true?_ (principles)                  |
| 2    | Architecture       | _What is the system?_ (design of record)                  |
| 3    | **Rulebooks**      | _How must we comply, in this domain?_ (enforceable rules) |
| 4    | Agent Contracts    | _What may this specific agent do?_                        |
| 5    | Workflow Contracts | _How is this process orchestrated?_                       |
| 6    | Source Code        | _How is it implemented?_                                  |

Rulebooks exist so that compliance is **mechanical and auditable**, not a matter of individual memory or good intentions. This directly serves the Constitution's central rule, `CP-1` (_enforcement over intention_): a guarantee that exists only as prose is a defect.

---

## What a Rulebook Is — and Is Not

A rulebook **is**:

- A set of enforceable, RFC 2119 rules for exactly one domain.
- Traceable: every rule cites the constitutional principle it enforces.
- Implementation-independent: it defines _what must hold_, never _how code achieves it_.
- Owned by an institutional role accountable for the domain.

A rulebook is **not**:

- An architecture document (it never redesigns or restates the system — it cites it).
- An implementation document (no code, no tool-specific how-to).
- A place to introduce new principles (only the Constitution may do that, via amendment).

If you find yourself writing _what the system is_, you are in the wrong tier — that belongs in the Architecture Canon. If you are writing _how to code it_, that belongs in source. A rulebook only ever answers _how must we comply here_.

---

## How New Rulebooks Are Created

The complete required set of 32 rulebooks is already fixed by the Framework (`rulebook_framework.md`, §5 Master Catalog). Creating a **new** rulebook beyond that set is a governance event, not a routine act.

1. **Justify the gap.** Propose the new rulebook via an ADR (see [`RB-25 · ADR`]). The ADR must show a genuine domain not covered by any existing rulebook and must not overlap the Single-Source-of-Truth Map (Framework §8). Overlap is grounds for rejection.
2. **Assign a single responsibility and owner.** Per Framework `RBK-A5` and the ownership roles (Framework §4). A rulebook with two responsibilities is invalid.
3. **Declare dependencies and boundaries.** Explicit in-scope / out-of-scope, and its position in the dependency graph (Framework §6).
4. **Draft against the Mandatory Structure.** Every rulebook must follow the 13-section template (Framework §2).
5. **Ratify.** Approval by the Architecture Review Board (ARB), co-signed by GRC or MRC where applicable (`RBK-OWN-1`). Only `RATIFIED` rulebooks are binding.

Authoring an **existing** catalogued rulebook (turning a catalog entry into its full ruleset) follows steps 4–5 only; the responsibility, owner, and boundaries are already defined by the Framework.

---

## How Rulebooks Evolve

Rulebooks are living documents, but they change under discipline:

- **Adding a rule** (`MINOR`): permitted when it strengthens compliance and cites a constitutional basis (`RBK-S2`). It must not contradict a sibling rulebook or the anti-duplication map.
- **Clarifying a rule** (`PATCH`): wording changes that do not alter meaning.
- **Weakening or removing a rule** (`MAJOR`): permitted only when the underlying architecture changed (via a PATCH patch) or the Constitution was amended. It requires an ADR and ARB approval. A rulebook **must never** be weakened merely to unblock work.
- **Constitutional dependency changes first.** If a change requires altering a principle, the Constitution is amended first (per `CLAUDE.md` AM-1..AM-4), the architecture second (via PATCH), and the rulebook last. Rulebooks follow; they never lead.

Every change is made on a branch via reviewed PR (per `RB-24 · GIT`), references its ADR and any Patch ID, and updates the rulebook's Change Log.

---

## How Rulebooks Are Versioned

- Rulebooks use **semantic versioning** `MAJOR.MINOR.PATCH` (Framework `RBK-VER`), matching `CLAUDE.md` VER-1.
- Each rulebook carries a **status**: `DRAFT → PROPOSED → RATIFIED → SUPERSEDED/RETIRED`. Only `RATIFIED` versions bind behavior.
- **Historical artifacts remain interpretable under the rulebook version in force when they were produced** (`CLAUDE.md` VER-2). A rulebook change must not retroactively invalidate a compliant past artifact; it applies going forward.
- Every rule has a **stable ID** (`<CODE>-<n>`, e.g., `PIT-3`) that never changes meaning across versions, so lower tiers and CI can cite it durably.
- The version, status, owner, and last-ratified date live in each rulebook's header (Framework §2, section 1).

---

## How Rulebooks Relate to the Constitution (`CLAUDE.md`)

- **Subordination.** A rulebook must never contradict the Constitution. Where it does, the rulebook is **void** until reconciled (`CLAUDE.md` RB-2).
- **Traceability.** Every rulebook rule must cite at least one constitutional rule ID as its basis (`RBK-S2`). A rule with no constitutional basis is prohibited — it would be legislating principle, which only the Constitution may do.
- **No duplication.** Rulebooks cite the Constitution and Architecture; they do not restate them (`CLAUDE.md` DOC-1, RB-1).
- **Entrenchment.** Rulebooks may only _strengthen_ the Constitution's entrenched clauses (Core Principles `CP-*`, AI Governance `AI-*`, Forbidden Practices `FB-*`); they may never weaken or carve exceptions to them (`CLAUDE.md` AM-2).

The rulebooks are, in effect, the Constitution's enforcement surface: the Constitution declares the law; the rulebooks make it checkable.

---

## How Rulebooks Relate to the Architecture

- **Grounding.** Every rulebook cites the architecture it operationalizes — specific ARCH sections and, where the rule enforces a migration outcome, the relevant PATCH patch ID (e.g., `P1-01`, `P2-07`).
- **Direction of change.** Architecture changes via the Patch Plan (PATCH); rulebooks then adjust to reflect the new architecture. Rulebooks never drive architectural change and never redesign the system.
- **Review rationale.** Where a rule exists to close a weakness identified in the audit, it cites the finding (e.g., REVIEW `C1`, `M3`). This preserves the "why" behind the "what".
- **Boundary.** If a proposed rule can only be satisfied by mandating a specific system design, that design belongs in the Architecture Canon (via an ADR/patch), not in the rulebook. The rulebook then references it.

---

## Directory Contents

| File                    | Role                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`             | This process guide.                                                                                                                       |
| `rulebook_framework.md` | Authoritative catalog, ownership, dependency graph, mandatory structure, anti-duplication map, enforcement model, ratification checklist. |
| `RB-NN-<slug>.md`       | Individual rulebooks (authored later, under the Framework). Not yet present.                                                              |

## Current Status

- ✅ Rulebook **Framework** ratified as the governing structure for this layer.
- ⏳ Individual rulebooks: **not yet authored.** The Framework fixes their identity, ownership, scope, and dependencies; their full rulesets are written subsequently, each ratified per Framework §10.

## Quick Start for Contributors

1. Read `CLAUDE.md` (Constitution) and the relevant Architecture Canon sections.
2. Read `rulebook_framework.md` — especially the Master Catalog (§5), the Mandatory Structure (§2), and the Single-Source-of-Truth Map (§8).
3. Confirm your concern is not already owned by an existing rulebook (§8). If it is, contribute there.
4. Follow _How Rulebooks Are Created / Evolve_ above. Open an ADR when required.
5. Ensure every rule you write is testable, cites a constitutional basis, and declares an enforcement mechanism.

---

_Rulebooks translate principle into practice. They are subordinate to the Constitution and the Architecture, supreme over contracts and code, and binding only when ratified._
