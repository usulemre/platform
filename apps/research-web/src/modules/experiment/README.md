# Experiment Module (v1)

The central research-management module. Presents research experiments through the
application layer. Same strict layering as the Dataset Module:

```
components / routing  →  hooks  →  application (ExperimentService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

- **domain/** — canonical DTOs (status, outcome, hypothesis, references, workflow
  status, validation, timeline, trial-ledger ref), view models, pure mappers and
  query logic, and pure summary aggregation (NOT statistics).
- **data/** — `ExperimentRepository` + `MockExperimentRepository` (dev) and
  `ApiExperimentRepository` (real transport, not wired in v1).
- **application/** — `ExperimentService` (the only layer the UI calls; also the
  dashboard summary) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free.

Integrations: **Experiment Tracking Governance** (pre-registration, trial-ledger
ref, frozen hypothesis), **Workflow Engine** (read-only workflow status by WFC
ref), **Validation Foundation** (validation summary), **Auth/Authz** (protected
route + nav). Dataset references cross-link to the Dataset Module.

Out of scope / forbidden here: experiment execution, statistical calculation,
persistence, application-layer bypass. Swap the mock at `application/container.ts`.
