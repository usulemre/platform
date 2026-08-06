# Feature Module (v1)

The canonical feature-engineering / feature-management module. Presents the
feature lifecycle through the application layer. Same strict layering as the
Dataset and Experiment modules:

```
components / routing  →  hooks  →  application (FeatureService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

- **domain/** — canonical DTOs (status, approval, leakage-harness, dependencies,
  usage, versions, lineage, workflow, registry facts), view models, pure mappers
  and query logic, and pure summary aggregation (NOT statistics).
- **data/** — `FeatureRepository` + `MockFeatureRepository` (dev) and
  `ApiFeatureRepository` (real transport, not wired in v1).
- **application/** — `FeatureService` (only layer the UI calls; also the dashboard
  summary) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, catalog card grid,
  detail panels).

Governance surfaced (architectural placeholders — read-only): Registration,
Versioning, Approval, Validation (+ leakage harness FA-2), Dependencies,
Ownership, Retirement. Integrations: Feature Registry (FRG), Validation
Foundation, Experiment Tracking Governance (usage in experiments), Workflow
Engine (approval workflow WFC-44), Auth/Authz.

Out of scope / forbidden: feature calculation, statistics, persistence,
application-layer bypass. Swap the mock at `application/container.ts`.
