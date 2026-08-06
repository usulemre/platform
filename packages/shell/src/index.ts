/**
 * @platform/shell — the canonical Application Shell shared by all apps.
 *
 * Structural UI only: layouts, navigation, command palette, theme, feedback
 * boundaries and placeholder surfaces. No business logic, no decisions. It
 * integrates with `@platform/auth` for authorization-aware navigation (advisory
 * UX; the backend remains authoritative).
 */
export * from './theme/theme-store';
export * from './theme/theme-provider';
export * from './theme/theme-toggle';

export * from './navigation/nav';
export * from './navigation/use-nav';
export * from './navigation/breadcrumbs';

export * from './layout/sidebar-store';
export * from './layout/sidebar';
export * from './layout/top-nav';
export * from './layout/user-menu';
export * from './layout/app-shell';

export * from './command/command-store';
export * from './command/command-palette';
export * from './command/use-register-commands';

export * from './placeholders/global-search';
export * from './placeholders/notification-center';
export * from './placeholders/workspace-switcher';

export * from './feedback/error-boundary';
export * from './feedback/loading-boundary';
export * from './feedback/empty-state';
export * from './feedback/not-found';
