# @platform/shell

The canonical Application Shell shared by every app: layouts, responsive
sidebar, top navigation, breadcrumbs, command-palette abstraction, theme
provider, user menu, feedback boundaries (error/loading/empty/not-found) and
placeholder surfaces (notifications, workspace switcher, global search).

- Integrates with `@platform/auth/react` for **authorization-aware navigation**
  (advisory UX; the backend remains the authoritative gate).
- Extensible without modification: apps supply a nav config and register command
  entries — feature modules plug in, the shell does not change.
- Server Components by default; only interactive chrome is `'use client'`.
