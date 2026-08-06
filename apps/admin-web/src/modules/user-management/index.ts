/**
 * User & Role Management Module (v1) — public surface for admin-web's routing
 * layer. Only container components are exported; the domain, data and application
 * layers are internal (the app depends on the application layer via these
 * components, never on repositories or infrastructure).
 */
export { UserDirectory } from './components/user-directory';
export { UserDetailView } from './components/user-detail-view';
export { RoleDirectory } from './components/role-directory';
export { RoleDetailView } from './components/role-detail-view';
export { PermissionMatrix } from './components/permission-matrix';
export { UmLoading, UmError } from './components/um-atoms';
