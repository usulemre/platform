# Risk Module (v1)

The canonical risk-assessment module. Presents advisory risk assessments of
portfolios, strategies and execution candidates through the application layer.
Same strict layering as the other modules:

```
components / routing  →  hooks  →  application (RiskService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

**The Risk Module provides advisory risk assessments only. It MUST NOT authorize
production execution independently.** An advisory notice is shown everywhere; the
execution recommendation is read-only and token-gated by Execution Governance.

- **domain/** — canonical DTOs (status, verdict, risk level, execution
  recommendation, subject, exposures, constraints, per-strategy risk, policy refs,
  exceptions, decision timeline, validation, workflow), view models, pure mappers
  and query logic, pure summary aggregation.
- **data/** — `RiskRepository` + `MockRiskRepository` (dev) and `ApiRiskRepository`
  (real transport, not wired in v1).
- **application/** — `RiskService` (only layer the UI calls) + composition root.
- **hooks/** — TanStack Query hooks (list/detail/summary) + Zustand UI store.
- **components/** — presentational, logic-free (dashboard, list, detail panels:
  portfolio/strategy risk summaries, exposure overview, constraint compliance,
  validation, decision timeline, governance references).

Governance surfaced (architectural placeholders, read-only): Risk Assessment
Registration, Risk Policy References, Constraint Verification, Exposure Review,
Risk Approval Workflow, Risk Exceptions, Risk Ownership, Risk Traceability.
Integrations: Risk Management Rulebook (RB-13), Validation Foundation, Workflow
Engine (WFC-47), Portfolio Registry, Strategy Registry, Execution Governance,
Auth/Authz. Subjects cross-link to the Portfolio/Strategy modules.

Out of scope / forbidden: VaR calculations, optimization, persistence,
application-layer bypass. Swap the mock at `application/container.ts`.
