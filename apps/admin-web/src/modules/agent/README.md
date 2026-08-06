# Agent Module (v1) — AI Agent Console

The AI Agent Console, implemented inside `apps/admin-web`. Centralized
administration, visibility and governance for AI agents in the Agent Registry.
For platform administrators and AI governance personnel. Same strict layering as
the other feature modules:

```
components / routing  →  hooks  →  application (AgentService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**AI agents propose and narrate; they never decide (AI-1..4, REG-9).** The DTO
type excludes any `DECIDES` authority. Model bindings are pinned metadata only —
no LLM providers, no model inference, no prompt execution.

- **domain/** — canonical DTOs (status, authority, model binding, capabilities,
  permissions, workflow assignments, evaluation, performance, health, validation,
  lifecycle, activity, versions), view models, pure mappers, pure query.
- **data/** — `AgentRepository` + `MockAgentRepository` (dev; roster mirrors the
  Agent Registry) and `ApiAgentRepository` (real transport, not wired in v1).
- **application/** — `AgentService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, registered-agents list,
  detail panels, lifecycle/activity timelines).

Integrations (read-only): Agent Registry, Workflow Engine, Workflow Contracts,
Agent Contracts, AI Governance, AI Agent Evaluation Framework, Production
Monitoring, Incident Response, Validation Foundation.

Out of scope / forbidden: LLM providers, model inference, prompt execution,
persistence, application-layer bypass. Swap the mock at
`application/container.ts`.
