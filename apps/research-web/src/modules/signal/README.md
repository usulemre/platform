# Signal Module (v1)

The canonical signal-management module. Presents research signals through the
application layer. Same strict layering as the Dataset/Experiment/Feature modules:

```
components / routing  →  hooks  →  application (SignalService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**Signals are advisory research outputs and MUST NOT execute trades.** The module
shows an advisory notice everywhere and surfaces execution eligibility as a
read-only status owned by Execution Governance (token-gated, paper-first). No
trading/execution path exists here.

- **domain/** — canonical DTOs (status, approval, execution eligibility, quality
  indicators, dependencies, strategy/experiment refs, versions, lineage,
  workflow), view models, pure mappers and query logic, pure summary aggregation.
- **data/** — `SignalRepository` + `MockSignalRepository` (dev) and
  `ApiSignalRepository` (real transport, not wired in v1).
- **application/** — `SignalService` (only layer the UI calls; also the summary) +
  composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, catalog card grid,
  detail panels, quality indicators, advisory notice).

Governance surfaced (architectural placeholders, read-only): Registration,
Versioning, Approval, Validation, Quality Assessment, Dependencies, Retirement,
Traceability. Integrations: Signal Registry (SIG), Feature Registry (feature
dependencies), Validation Foundation, Workflow Engine (WFC-46), Execution
Governance (eligibility), Auth/Authz.

Out of scope / forbidden: signal generation, trading/execution, statistics,
persistence, application-layer bypass. Swap the mock at `application/container.ts`.
