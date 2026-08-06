import type { ReactNode } from 'react';

/**
 * Dashboard Layout. Uses a parallel route (`@panel`) for an optional contextual
 * side panel, so future modules can render a panel alongside a page without
 * modifying this layout. When no panel matches, the `@panel/default.tsx` slot
 * renders nothing and the region collapses.
 */
export default function DashboardLayout({
  children,
  panel,
}: {
  children: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{children}</div>
      <aside className="hidden xl:block">{panel}</aside>
    </div>
  );
}
