'use client';

import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, CommandPalette, useRegisterCommands, type Command } from '@platform/shell';
import { useLogout } from '@platform/auth/react';
import { authClient } from '@/lib/auth';
import { appNav } from '@/app/nav';

/**
 * Client chrome that wires the shell to the app: supplies the sign-out action
 * (via the app's auth client) and registers baseline command-palette entries.
 * Server-rendered `children` pass straight through into the shell content area.
 */
export function ProtectedChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const logout = useLogout(authClient);

  // Keep the mutation handle in a ref so the sign-out callback stays stable and
  // does not churn the command registry.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const signOut = useCallback(() => {
    logoutRef.current.mutate(undefined, { onSuccess: () => router.replace('/login') });
  }, [router]);

  const commands = useMemo<Command[]>(
    () => [
      { id: 'nav-dashboard', label: 'Go to Dashboard', group: 'Navigation', href: '/dashboard' },
      { id: 'nav-workspace', label: 'Go to Workspace', group: 'Navigation', href: '/workspace' },
      { id: 'nav-research', label: 'Go to Research', group: 'Navigation', href: '/research' },
      { id: 'nav-datasets', label: 'Go to Datasets', group: 'Navigation', href: '/datasets' },
      {
        id: 'nav-experiments',
        label: 'Go to Experiments',
        group: 'Navigation',
        href: '/experiments',
      },
      { id: 'nav-features', label: 'Go to Features', group: 'Navigation', href: '/features' },
      {
        id: 'nav-feature-store',
        label: 'Go to Feature store',
        group: 'Navigation',
        href: '/feature-store',
      },
      { id: 'nav-signals', label: 'Go to Signals', group: 'Navigation', href: '/signals' },
      {
        id: 'nav-signal-engine',
        label: 'Go to Signal engine',
        group: 'Navigation',
        href: '/signal-engine',
      },
      { id: 'nav-strategies', label: 'Go to Strategies', group: 'Navigation', href: '/strategies' },
      {
        id: 'nav-backtesting',
        label: 'Go to Backtesting',
        group: 'Navigation',
        href: '/backtesting',
      },
      { id: 'nav-portfolios', label: 'Go to Portfolios', group: 'Navigation', href: '/portfolios' },
      {
        id: 'nav-portfolio-construction',
        label: 'Go to Portfolio construction',
        group: 'Navigation',
        href: '/portfolio-construction',
      },
      { id: 'nav-risk', label: 'Go to Risk', group: 'Navigation', href: '/risk' },
      {
        id: 'nav-risk-engine',
        label: 'Go to Risk engine',
        group: 'Navigation',
        href: '/risk-engine',
      },
      { id: 'nav-execution', label: 'Go to Execution', group: 'Navigation', href: '/execution' },
      {
        id: 'nav-execution-simulator',
        label: 'Go to Execution simulator',
        group: 'Navigation',
        href: '/execution-simulator',
      },
      {
        id: 'nav-live-trading',
        label: 'Go to Live trading',
        group: 'Navigation',
        href: '/live-trading',
      },
      {
        id: 'nav-performance-analytics',
        label: 'Go to Performance analytics',
        group: 'Navigation',
        href: '/performance-analytics',
      },
      {
        id: 'nav-feature-calculation',
        label: 'Go to Feature calculation',
        group: 'Navigation',
        href: '/feature-calculation',
      },
      {
        id: 'nav-signal-calculation',
        label: 'Go to Signal calculation',
        group: 'Navigation',
        href: '/signal-calculation',
      },
      {
        id: 'nav-portfolio-optimization',
        label: 'Go to Portfolio optimization',
        group: 'Navigation',
        href: '/portfolio-optimization',
      },
      { id: 'nav-profile', label: 'Go to Profile', group: 'Account', href: '/profile' },
      { id: 'session-sign-out', label: 'Sign out', group: 'Session', run: signOut },
    ],
    [signOut],
  );
  useRegisterCommands(commands);

  return (
    <>
      <AppShell navGroups={appNav} onSignOut={signOut} title="Research Platform">
        {children}
      </AppShell>
      <CommandPalette />
    </>
  );
}
