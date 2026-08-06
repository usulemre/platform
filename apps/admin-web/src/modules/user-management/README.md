# User & Role Management Module (v1)

The canonical identity-directory administration module, inside `apps/admin-web`.
Manages users, groups, roles, permissions and policies. Same strict layering as
the other feature modules:

```
components / routing  →  hooks  →  application (UserManagementService)  →  data (Repository)  →  domain (DTO/VM/mappers/query)
```

Integrates with Authentication & Authorization by reusing the shared `@platform/auth`
`AppId` and the `@platform/types` `Page<T>` envelope.

- **domain/** — canonical DTOs (users, groups, roles, permissions, policies,
  sessions, activity), view models, pure `applyUserQuery` (search/filter/sort/
  **pagination**), pure mappers + `buildPermissionMatrix`.
- **data/** — `UserManagementRepository` + `MockUserManagementRepository` (dev)
  and `ApiUserManagementRepository` (real transport, not wired in v1).
- **application/** — `UserManagementService` (only layer the UI calls; resolves
  role members and builds the matrix) + composition root.
- **hooks/** — TanStack Query hooks + Zustand UI store (search/filter/sort/page).
- **components/** — presentational, logic-free (user directory + pagination, user
  detail with profile/status/roles/groups/permissions/activity/sessions, role
  directory + detail, permission matrix).

Governance surfaced (read-only placeholders): Users, Groups, Roles, Permissions,
Memberships, Assignments, Policies, Access Levels, Session History. Assignments
and access elevation are governed; this console presents, it does not mutate.

Out of scope / forbidden: persistence, external identity providers, application-
layer bypass. Swap the mock at `application/container.ts`.
