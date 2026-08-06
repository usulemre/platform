# apps/ — User Applications

> **Phase 0 scaffolding placeholder.** Structure only — no application code.

## Purpose

Human access, control, and human-in-the-loop gates: the consoles through which named humans
approve, oversee, and monitor the platform. Applications act **only** through governed
service APIs and gates — they never contain decision logic and never bypass a control.

## Scope

Frontend/console applications only. All authority resolves to the deterministic engines and
human governance behind the service contracts (Architecture V2 §5.9 boundary; §6.2 human
boundary). Built in **Phase 7** (Implementation Roadmap, Part C).

## Members

> Canonical applications — exactly one per responsibility (Architecture V2 application-layer
> normalization). The earlier `research-ui` / `admin-ui` / `monitoring-ui` / `docs-portal`
> placeholders were merged into these; no functionality was lost.

- `research-web/` — surfaces registries, experiments, and verdicts (read + propose).
- `admin-web/` — administration, ownership, lifecycle, and approval/sign-off consoles.
- `monitoring-web/` — production monitoring, drift/parity, and alerting views.
- `docs/` — the governance and documentation portal.

## Allowed Contents

UI application skeletons; API-client bindings to service contracts; approval/sign-off UI
placeholders; documentation. No back-doors around governed APIs.

## Forbidden Contents

Any decision, validation, risk, allocation, or execution logic; any path that bypasses a
governance gate or control (Architecture V2 §5.9 Failure); direct database or engine access.

## Ownership

Accountable role: PE. Architecture owner: ARB.

## Dependencies

Consumes Phases 2–6 strictly through their service/API contracts. No app depends on another
app; no circular dependencies.

## Related Governance Documents

CLAUDE.md (HO-1..4); Architecture V2 §5.9, §6.2; RB-20 · CODE; RB-23 · DOC; Implementation
Roadmap Phase 7.
