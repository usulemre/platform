# Dataset Module (v1)

The first production business module. Presents registered datasets through the
application layer.

Layering (strict, inward-only dependencies):

```
components / routing  →  hooks  →  application (DatasetService)  →  data (Repository)  →  domain (DTO/VM/mappers)
```

- **domain/** — canonical DTOs, view models, pure mappers and query logic.
- **data/** — `DatasetRepository` abstraction + `MockDatasetRepository` (dev) and
  `ApiDatasetRepository` (real transport, not wired in v1).
- **application/** — `DatasetService` (the only layer the UI calls) + composition
  root binding the mock adapter.
- **hooks/** — TanStack Query hooks + Zustand UI-state store (search/filter/sort).
- **components/** — presentational, logic-free (they render view models).

Boundaries: depends only on the application service; never accesses
infrastructure; consumes canonical DTOs; governed state changes (certification,
retirement) run through workflows (not performed here). No persistence, no live
ingestion. Swap the mock for the API adapter at `application/container.ts`.
