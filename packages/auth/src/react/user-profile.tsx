'use client';

/**
 * @platform/auth/react · user-profile — the current user's profile derived from
 * the session snapshot (identity, roles, permissions, app access, session
 * validity). Framework-independent (plain Tailwind; no Next, no UI library).
 */
import type { ReactNode } from 'react';
import { useSession } from './context';
import { toUserProfileVm } from '../iam/mappers';
import type { UserProfileVm } from '../iam/view-model';

export function useUserProfile(): {
  profile: UserProfileVm | null;
  isLoading: boolean;
  isError: boolean;
} {
  const session = useSession();
  return {
    profile: session.snapshot ? toUserProfileVm(session.snapshot) : null,
    isLoading: session.isLoading,
    isError: session.isError,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ items, empty }: { items: readonly string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">
          {item}
        </span>
      ))}
    </div>
  );
}

export function UserProfile() {
  const { profile, isLoading, isError } = useUserProfile();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }
  if (isError || !profile) {
    return (
      <p className="text-sm text-muted-foreground">
        You are not signed in, or the profile is unavailable.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-background p-4">
        <p className="text-lg font-semibold">{profile.displayName}</p>
        <p className="text-sm text-muted-foreground">
          {profile.username}
          {profile.email ? ` · ${profile.email}` : ''} · {profile.identityType} ·{' '}
          {profile.authority}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="Roles">
          <Chips items={profile.roles} empty="No roles assigned." />
        </Section>
        <Section title="Application access">
          <Chips items={profile.apps} empty="No application access." />
        </Section>
        <Section title="Permissions">
          <Chips items={profile.permissions} empty="No permissions granted." />
        </Section>
        <Section title="Session">
          <p className="text-sm">
            Issued {profile.sessionIssuedLabel} · expires {profile.sessionExpiresLabel}
          </p>
        </Section>
      </div>
    </div>
  );
}
