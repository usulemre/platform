'use client';

import { usePermissions } from '@platform/auth/react';
import { filterNav, type NavGroup } from './nav';

/** Returns the nav groups the current identity may see (advisory UX filter). */
export function useNav(groups: readonly NavGroup[]): NavGroup[] {
  const perms = usePermissions();
  return filterNav(groups, { canAll: perms.canAll });
}
