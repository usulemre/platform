# execution module (admin-web · Phase 7.7)

The trader-facing UI for the **Execution Engine**. Its data layer runs on inert mock executions built
via the real `@platform/execution-engine-sdk` lifecycle state machine + policy framework (executions
are constructed by walking legal status paths, so their timelines replay consistently). No order is
executed; no broker/exchange/FIX.

## Layering

```
components (Client Components)
  → hooks (TanStack Query + a planner-preview mutation)
  → application (ExecutionAdminService: execution → view-model + aggregate views + plan preview)
  → data (repository · Mock adapter · seed built by walking legal lifecycle paths · UI-local plan preview)
  → domain (query · derive[metrics/health/replay] · mappers) → @platform/execution-engine-sdk (state machine + policies + models)
```

## Surfaces (`/execution`, `/execution/*`)

Dashboard · Queue · Planner · Policies · Timeline · Sessions · Health · Metrics · Replay · History ·
Audit · Execution detail.

## What it is (and is not)

- **Is:** presentation of execution lifecycle state and a deterministic plan preview.
- **Is not:** no lifecycle/policy logic of its own (that is the SDK/service), no persistence, no
  broker/exchange/FIX, no execution. Read-only.
