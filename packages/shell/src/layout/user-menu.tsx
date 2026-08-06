'use client';

import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { Button } from '@platform/ui';
import { useIdentity } from '@platform/auth/react';

export interface UserMenuProps {
  onSignOut?: () => void;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Identity-aware user menu. Reads the current identity from the auth context;
 *  the sign-out action is supplied by the app (keeps the shell auth-client
 *  agnostic). */
export function UserMenu({ onSignOut }: UserMenuProps) {
  const identity = useIdentity();
  const [open, setOpen] = useState(false);
  const initials = identity ? initialsOf(identity.displayName) : '?';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-label="User menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
          {initials}
        </span>
      </Button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border bg-background p-1 shadow-md">
            <div className="flex items-center gap-2 px-2 py-2 text-sm">
              <User className="h-4 w-4" />
              <div className="min-w-0">
                <div className="truncate font-medium">{identity?.displayName ?? 'Signed out'}</div>
                {identity?.email ? (
                  <div className="truncate text-xs text-muted-foreground">{identity.email}</div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut?.();
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
