import type { ReactNode } from 'react';

/** Public authentication layout (Server Component): a centered card frame. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
