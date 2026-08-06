# Notification Center Module (v1)

The canonical communication hub, inside `apps/admin-web`. Centralized, read-only
notification management across every platform module. Same strict layering as the
other feature modules:

```
components / routing  →  hooks  →  application (NotificationService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**Consumes notification events exposed by application services. Contains NO
business logic.** No email delivery, no push, no WebSocket, no persistence.

- **domain/** — canonical DTOs (notification with category, priority, status,
  delivery status, source, metadata; per-category preferences), view models, pure
  `applyNotificationQuery` (search/filter/order/**pagination**), pure mappers +
  summary aggregation.
- **data/** — `NotificationRepository` + `MockNotificationRepository` (dev;
  notifications span every category) and `ApiNotificationRepository` (real
  transport, not wired in v1).
- **application/** — `NotificationService` (only layer the UI calls) + composition
  root.
- **hooks/** — TanStack Query hooks + Zustand UI store (search/filter/order/page).
- **components/** — presentational, logic-free: dashboard (unread, priority
  breakdown, category tiles, recent), inbox (unread-highlighted list; also serves
  category and Unread views via locks), detail (delivery status), preferences.

Categories (15): System, Research, Workflow, Execution, Risk, Validation, Dataset,
Experiment, Feature, Signal, Strategy, Portfolio, Monitoring, AI Agent,
Governance. Integrations (read-only): Auth & Authz, User & Role Management, Audit
Center, Monitoring, Workflow Engine, Validation Foundation, AI Agent Console,
Execution Module.

Out of scope / forbidden: email delivery, push notifications, WebSocket
infrastructure, persistence, application-layer bypass. Swap the mock at
`application/container.ts`.
