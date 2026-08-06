# Research Workspace (Phase 5.6)

The researcher's productivity home inside `research-web`. It unifies the existing
research modules — datasets, experiments, features, signals, strategies,
portfolios — plus activity, notifications, saved views and preferences into a
single, **read-only, cross-module** surface.

## What it is (and is not)

- **Is:** an aggregation/navigation layer. Every panel presents already-produced
  metadata and links into the module that owns the artifact.
- **Is not:** a place where anything is decided, computed, or stored. Per the
  Phase 5.6 constraints it contains **no quantitative algorithms**, **no
  persistence**, and **never bypasses the application layer**.

## Layering

```
components / routes  →  hooks  →  application (WorkspaceService)
                                     →  data (WorkspaceRepository + Mock/Api)
                                     →  domain (DTO / VM / pure mappers)
```

- **domain** — `dto.ts` (transport shapes), `view-model.ts` (UI-facing shapes),
  `mappers.ts` (pure DTO→VM: tones, labels, dates, cross-module hrefs).
- **data** — `repository.ts` (interface), `mock-repository.ts` (synthetic
  metadata; ids match the other modules' seeds so links resolve),
  `api-repository.ts` (real adapter over `@platform/api-client`; not wired in v1).
- **application** — `workspace-service.ts` (the only layer hooks call),
  `container.ts` (composition root — swap the mock for the Api adapter to go live).
- **hooks** — TanStack Query hooks calling the service.
- **components** — logic-free presentation; `workspace-atoms.tsx` holds the
  shared primitives, including `GlobalSearchButton` which opens the shell command
  palette (`useCommandStore` from `@platform/shell`).

## Deliverables mapped

Workspace Home (`workspace-home.tsx`), Research Dashboard + Quick Actions +
Global Search (`research-dashboard.tsx`), Active Experiments and Recent
Datasets/Features/Signals/Strategies/Portfolios (`recent-panels.tsx`), Favorites,
Bookmarks, Activity Feed, Notifications Panel, Saved Views, Workspace Preferences.

## Routes (`(protected)/workspace`)

`/workspace` (home + loading + error), `/workspace/preferences`,
`/workspace/saved-views`, `/workspace/bookmarks`, `/workspace/activity`.
Nav entry and a "Go to Workspace" command are registered in the app shell.

## Going live

Replace `new MockWorkspaceRepository()` in `application/container.ts` with
`new ApiWorkspaceRepository(apiClient)`. No hook, service, or UI change required.
