# Strategy Module (v1)

The canonical strategy-management module. Presents investment strategies built
from approved signals, through the application layer. Same strict layering as the
Dataset/Experiment/Feature/Signal modules:

```
components / routing  →  hooks  →  application (StrategyService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**Strategies are advisory until explicitly approved for portfolio construction.**
The module shows an advisory notice everywhere and surfaces `portfolioEligibility`
as a read-only, governed status. No portfolio construction, no trading, no
optimization here.

- **domain/** — canonical DTOs (status, approval, portfolio eligibility, signal
  composition, risk indicators, validation, refs, versions, lineage, workflow,
  timeline), view models, pure mappers and query logic, pure summary aggregation.
- **data/** — `StrategyRepository` + `MockStrategyRepository` (dev) and
  `ApiStrategyRepository` (real transport, not wired in v1).
- **application/** — `StrategyService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, catalog card grid,
  lifecycle timeline, signal composition, risk summary, performance placeholder,
  detail panels).

Governance surfaced (architectural placeholders, read-only): Registration,
Versioning, Approval, Validation, Review, Ownership, Retirement, Traceability.
Integrations: Strategy Registry (STR), Signal Registry (composition), Validation
Foundation, Workflow Engine (WFC-46/47), Risk Engine (risk summary), Auth/Authz.

Out of scope / forbidden: trading algorithms, optimization, statistics,
persistence, application-layer bypass. Swap the mock at `application/container.ts`.
