# Audit Center Module (v1)

The canonical audit & traceability module, inside `apps/admin-web`. Centralized,
read-only visibility into every auditable activity across the platform. Same
strict layering as the other feature modules:

```
components / routing  →  hooks  →  application (AuditService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**Read-only.** Events are produced by the governed services (Event & Messaging
Foundation); this module never writes, stores or logs events.

- **domain/** — canonical DTOs (audit event with category, outcome, actor,
  target, source, correlation/request/session/trace IDs, metadata, change
  history), view models, pure `applyAuditQuery` (search/filter/order/**pagination**),
  pure mappers + summary aggregation.
- **data/** — `AuditRepository` + `MockAuditRepository` (dev; events span every
  category) and `ApiAuditRepository` (real transport over the audit service, not
  wired in v1).
- **application/** — `AuditService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks + Zustand UI store (search/filter/order/page).
- **components/** — presentational, logic-free: dashboard (totals, outcome
  breakdown, category tiles, recent timeline), explorer (search/filter/order/
  paginate table; also serves category activity when locked), timeline, event
  detail (summary, traceability IDs, metadata, change history).

Categories (per-domain activity): User, Agent, Workflow, Execution, Validation,
Dataset, Experiment, Feature, Signal, Strategy, Portfolio, Governance, Auth,
System. Integrations (read-only): every module + Auth/Workflow/Validation/
Event-&-Messaging foundations and governance.

Out of scope / forbidden: persistence, event storage, infrastructure logging,
application-layer bypass. Swap the mock at `application/container.ts`.
