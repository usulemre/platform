'use client';

import { Menu } from 'lucide-react';
import { Button } from '@platform/ui';
import { Breadcrumbs } from '../navigation/breadcrumbs';
import { GlobalSearch } from '../placeholders/global-search';
import { NotificationCenter } from '../placeholders/notification-center';
import { ThemeToggle } from '../theme/theme-toggle';
import { useCommandStore } from '../command/command-store';
import { useSidebarStore } from './sidebar-store';
import { UserMenu } from './user-menu';

export interface TopNavProps {
  onSignOut?: () => void;
  breadcrumbLabels?: Record<string, string>;
}

/** Top navigation bar: mobile menu trigger, breadcrumbs, global search,
 *  notifications, theme toggle and the user menu. */
export function TopNav({ onSignOut, breadcrumbLabels }: TopNavProps) {
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const openCommand = useCommandStore((state) => state.open);

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <Breadcrumbs labels={breadcrumbLabels} />
      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch onOpen={openCommand} />
        <NotificationCenter />
        <ThemeToggle />
        <UserMenu onSignOut={onSignOut} />
      </div>
    </header>
  );
}
