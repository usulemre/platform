import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { SESSION_COOKIE } from '@platform/auth';
import { ProtectedChrome } from '@/components/protected-chrome';

/**
 * Protected area root (Server Component). Enforces authentication server-side
 * (defence-in-depth with the edge middleware), then renders the Application
 * Shell around the routed content.
 */
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.has(SESSION_COOKIE)) {
    redirect('/login');
  }
  return <ProtectedChrome>{children}</ProtectedChrome>;
}
