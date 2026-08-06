import type { ComponentType } from 'react';

/**
 * Navigation model. Apps declare a nav config; feature modules extend that
 * config without modifying the shell. Icons are provided as components so the
 * shell stays icon-library-agnostic.
 */
export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon?: ComponentType<{ className?: string }>;
  /** Advisory UX gate — hidden unless the user holds all of these. */
  readonly requiredPermissions?: readonly string[];
}

export interface NavGroup {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly NavItem[];
}

export interface PermissionCheck {
  readonly canAll: (permissions: readonly string[]) => boolean;
}

/**
 * Authorization-aware filtering (pure). Items with no requirement are always
 * visible; empty groups are dropped. This governs VISIBILITY only — the backend
 * remains the authoritative authorization boundary (CLAUDE.md CP-5).
 */
export function filterNav(groups: readonly NavGroup[], check: PermissionCheck): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.requiredPermissions || check.canAll(item.requiredPermissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
