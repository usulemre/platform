# Research (research-web UI, Phase 6.4)

The researcher-facing interface for the canonical **Research Engine**, inside
`research-web`. It surfaces the research projects orchestrated by
`services/research-service` and speaks the shared vocabulary from
`@platform/research-sdk`.

## What it is (and is not)

- **Is:** a read-only console over the research lifecycle — dashboard, registry,
  project details (hypothesis, lifecycle timeline, objectives, dependencies,
  milestones, validation/reviews, approval, sessions, artifacts, metadata,
  metrics), templates and Research Workspace integration.
- **Is not:** a compute layer. It runs no quantitative algorithms, no statistical
  tests, and contains no business logic in components (formatting/aggregation is
  in the pure mappers/service). It never validates significance or approves
  capital — those are deterministic/human governance decisions.

## Shared contracts

The canonical models and enums (research lifecycle stages, capabilities, statuses,
and the ResearchProject/Session/Objective/Hypothesis/… objects) come from
**`@platform/research-sdk`** — the single source of truth shared with the service
tier, which orchestrates across the dataset/feature/signal/strategy/portfolio
modules, the Market Data Platform and the Research Workspace.

## Layering

```
components / routes  →  hooks  →  application (ResearchAdminService)
                                     →  data (ResearchRepository + Mock/Api)
                                     →  domain (VM / mappers / query, over @platform/research-sdk)
```

Swap `MockResearchRepository` for `new ApiResearchRepository(apiClient)` in
`application/container.ts` (over the research service gateway) to go live — no
hook/service/UI change.

## Routes

`/research` (dashboard + registry, with loading + error), `/research/[projectId]`
(details), `/research/templates`. A nav entry and a "Go to Research" command are
wired into research-web; artifacts deep-link into the datasets/features/signals/
strategies/portfolios modules, and the dashboard links to `/workspace`.
