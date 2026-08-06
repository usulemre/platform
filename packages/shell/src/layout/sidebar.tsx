'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@platform/utils';
import { useNav } from '../navigation/use-nav';
import { WorkspaceSwitcher } from '../placeholders/workspace-switcher';
import { useSidebarStore } from './sidebar-store';
import type { NavGroup } from '../navigation/nav';

export interface SidebarProps {
  groups: readonly NavGroup[];
  title?: string;
}

/** Responsive sidebar: a fixed column on desktop, a drawer on mobile. Nav items
 *  are filtered by the current identity's permissions (advisory UX). */
export function Sidebar({ groups, title = 'Platform' }: SidebarProps) {
  const visibleGroups = useNav(groups);
  const pathname = usePathname();
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  const content = (
    <nav className="flex h-full w-64 flex-col gap-4 border-r bg-background p-4">
      <div className="px-1 text-sm font-semibold">{title}</div>
      <WorkspaceSwitcher />
      <div className="flex flex-col gap-4">
        {visibleGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            {group.label ? (
              <div className="px-2 text-xs uppercase tracking-wide text-muted-foreground">
                {group.label}
              </div>
            ) : null}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    active && 'bg-accent font-medium text-accent-foreground',
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden md:block">{content}</aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full">{content}</div>
        </div>
      ) : null}
    </>
  );
}
