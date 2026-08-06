'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import type { NavGroup } from '../navigation/nav';

export interface AppShellProps {
  navGroups: readonly NavGroup[];
  children: ReactNode;
  onSignOut?: () => void;
  title?: string;
  breadcrumbLabels?: Record<string, string>;
}

/** The Dashboard Layout frame: responsive sidebar + top navigation + content
 *  region. Children are server-rendered and passed through unchanged. */
export function AppShell({
  navGroups,
  children,
  onSignOut,
  title,
  breadcrumbLabels,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar groups={navGroups} title={title} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onSignOut={onSignOut} breadcrumbLabels={breadcrumbLabels} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
