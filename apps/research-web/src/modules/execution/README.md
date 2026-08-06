# Execution Module (v1)

The canonical execution-management module. Presents and orchestrates governed
execution requests through the application layer. Same strict layering as the
other modules:

```
components / routing  →  hooks  →  application (ExecutionService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**The Execution Module orchestrates governed execution workflows but MUST NOT
implement broker connectivity or exchange integrations.** No broker APIs, no
exchange connectivity, no order routing. An advisory notice is shown everywhere;
execution is paper-first and token-gated by Execution Governance, surfaced
read-only (the time-boxed authorization token, deployment mode, cancellation
availability).

- **domain/** — canonical DTOs (status, mode, authorization token, risk approval,
  portfolio/strategy/signal refs, validation, timeline, workflow), view models,
  pure mappers and query logic, pure summary aggregation.
- **data/** — `ExecutionRepository` + `MockExecutionRepository` (dev) and
  `ApiExecutionRepository` (real transport, not wired in v1).
- **application/** — `ExecutionService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, queue, detail panels:
  authorization, risk approval, references, validation, timeline).

Governance surfaced (architectural placeholders, read-only): Execution Requests,
Execution Approval, Execution Authorization, Execution Lifecycle, Execution
Monitoring, Execution Cancellation, Execution Traceability, Execution Audit.
Integrations: Execution Governance (authorization token), Workflow Engine
(WFC-49), Validation Foundation, Risk Module (risk approval → `/risk/[id]`),
Portfolio/Strategy/Signal Registries, Auth/Authz.

Out of scope / forbidden: broker APIs, exchange connectivity, order routing,
persistence, application-layer bypass. Swap the mock at `application/container.ts`.
