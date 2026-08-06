# Portfolio Module (v1)

The canonical portfolio-management module and the final module in the research
chain. Presents research portfolios built from approved strategies, through the
application layer. Same strict layering as the other modules:

```
components / routing  →  hooks  →  application (PortfolioService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**Portfolios are research outputs / proposed allocations and MUST NOT authorize
live trading or execution.** The module shows an advisory notice everywhere and
surfaces the deployment mode (RESEARCH/PAPER/LIVE) read-only, owned by Execution
Governance (token-gated, paper-first). No optimization, no position sizing here.

- **domain/** — canonical DTOs (status, approval, deployment mode, holdings,
  allocations, strategy composition, constraints, risk indicators, validation,
  refs, versions/snapshots, lineage, workflow), view models, pure mappers and
  query logic, pure summary aggregation.
- **data/** — `PortfolioRepository` + `MockPortfolioRepository` (dev) and
  `ApiPortfolioRepository` (real transport, not wired in v1).
- **application/** — `PortfolioService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, catalog, holdings view,
  allocation/constraint/risk summaries, strategy composition, performance &
  rebalance placeholders, detail panels).

Governance surfaced (architectural placeholders, read-only): Registration,
Versioning, Approval, Validation, Constraints, Review, Ownership, Retirement,
Traceability. Integrations: Portfolio Registry (PFR), Strategy Registry
(composition), Validation Foundation, Workflow Engine (WFC-48), Risk Engine,
Portfolio Construction Rulebook (constraints), Auth/Authz.

Out of scope / forbidden: optimization, position sizing, statistics, persistence,
application-layer bypass. Swap the mock at `application/container.ts`.
