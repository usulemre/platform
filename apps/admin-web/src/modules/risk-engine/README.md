# risk-engine module (admin-web · Phase 6.10)

The administrator-facing UI for the **Risk Engine**. A fully layered module that renders
the risk registry, portfolio risk details, risk policies + rule explorer, limit
configuration, the approval queue, exceptions, overrides and the audit timeline — reading
through the shared vocabulary in `@platform/risk-sdk`.

It shares the same layered stack as the research-web risk-engine module (domain / data /
application / hooks / components) but is a **self-contained copy**: the admin mappers do
not deep-link into research-web modules (dependency/lineage/subject cross-links render as
plain labels), and the admin application service adds registry-wide aggregation views
(rule explorer, limit configuration, exceptions, overrides, audit timeline).

## What it is (and is not)

- **Is:** presentation + administration surfaces. All labels, tones, tables and timelines
  are derived by pure mappers so components stay logic-free.
- **Is not:** a risk model. It runs **no** VaR, **no** CVaR, **no** stress testing, computes
  **no** exposures, holds **no** business logic and **no** persistence. Bounds are
  configured, utilization/exposures are reported by the risk model, and every
  verdict/approval/disposition is decided elsewhere — reflected here, never decided here.

## Routes

`/risk-engine` (dashboard + registry) · `/[assessmentId]` (portfolio risk details) ·
`/policies` (policies + rule explorer) · `/limits` (limit configuration) ·
`/approvals` (approval queue + exceptions + overrides) · `/audit` (audit timeline).
