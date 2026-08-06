/**
 * Audit Center Module (v1) — public surface for admin-web's routing layer. Only
 * container components are exported; the domain, data and application layers are
 * internal (the app depends on the application layer via these components, never
 * on repositories or infrastructure).
 */
export { AuditDashboard } from './components/audit-dashboard';
export { AuditExplorer, CategoryActivity } from './components/audit-explorer';
export { AuditTimeline } from './components/audit-timeline';
export { EventDetailView } from './components/event-detail-view';
export { AuditLoading, AuditError } from './components/audit-atoms';
export type { EventCategoryDto } from './domain/dto';
