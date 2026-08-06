# Monitoring Module (v1)

The operational monitoring feature of `monitoring-web`. Centralized, read-only
visibility into platform health, status and operational state. Same strict
layering as the research-web feature modules:

```
components / routing  →  hooks  →  application (MonitoringService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**Consumes operational data exposed by platform services. Contains NO business
logic.** All levels/statuses/verdicts are pre-classified upstream; the module
only maps `MonitorLevel` → tone and formats dates.

- **domain/** — canonical monitoring DTOs (system status, platform overview,
  service/workflow/execution/validation/dataset/agent/alert/incident/metric/audit),
  view models, pure mappers, and a pure service-list query (search/filter/sort).
- **data/** — `MonitoringRepository` + `MockMonitoringRepository` (dev) and
  `ApiMonitoringRepository` (real transport over the Monitoring Service, not
  wired in v1).
- **application/** — `MonitoringService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks (one per operational slice) + Zustand UI store.
- **components/** — presentational, logic-free (overview, per-domain monitor
  panels via a generic `MonitorListPanel`, audit timeline, searchable service list).

Integrations (read-only): Monitoring Service, Workflow Engine, Validation
Foundation, Execution Module, Dataset Module, Agent Registry, Incident Response
Governance, Production Monitoring Governance.

Out of scope / forbidden: monitoring infrastructure, metrics collection, alert
delivery, persistence, application-layer bypass. Swap the mock at
`application/container.ts`.
