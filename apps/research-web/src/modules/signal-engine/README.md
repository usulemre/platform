# Signal Engine (research-web UI, Phase 6.7)

The researcher-facing interface for the canonical **Signal Engine**, inside
`research-web`. It surfaces the quantitative trading signals orchestrated by
`services/signal-engine-service` and speaks the shared vocabulary from
`@platform/signal-sdk`.

## What it is (and is not)

- **Is:** a read-only console over the signal research lifecycle — dashboard,
  registry explorer + catalog (search/filter/sort), signal details (lifecycle,
  definition, validation status, versions, dependencies, lineage, review,
  approval, promotion, ownership, usage, quality, health, registry sync, tags,
  metadata), the promotion and approval queues, and signal families.
- **Is not:** a compute layer. It implements no alpha models, no signal
  calculations, no statistical tests, no ML, and contains no business logic in
  components (formatting/aggregation is in the pure mappers/service). It never
  validates significance, approves a signal or decides promotion — those verdicts
  are produced by deterministic engines and accountable humans and are only
  reflected here.

## Signal lifecycle

```
Candidate → Research → Validation → Review → Approval → Signal Registry → Production Candidate
```

## Shared contracts

The canonical models and enums (RegisteredSignal, SignalDefinition, SignalVersion,
SignalDependency, SignalLineage, SignalValidation, SignalApproval, SignalReview,
SignalPromotion, SignalFamily, SignalOwner, SignalUsage, and the 7 lifecycle
stages + validation / approval / review / promotion / quality / health / sync
statuses) come from **`@platform/signal-sdk`** — the single source of truth shared
with the service tier.

## Layering

```
components / routes  →  hooks  →  application (SignalEngineAdminService)
                                     →  data (SignalEngineRepository + Mock/Api)
                                     →  domain (VM / mappers / query, over @platform/signal-sdk)
```

Swap `MockSignalEngineRepository` for `new ApiSignalEngineRepository(apiClient)`
in `application/container.ts` (over the signal-engine service gateway) to go live
— no hook/service/UI change.

## Routes

`/signal-engine` (dashboard + catalog/explorer, with loading + error),
`/signal-engine/[signalId]` (details), `/signal-engine/queues` (promotion +
approval), `/signal-engine/families`. A nav entry and a "Go to Signal engine"
command are wired into research-web; dependencies and lineage deep-link into the
datasets, features and signals modules.
