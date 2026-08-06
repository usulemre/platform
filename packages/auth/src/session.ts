/**
 * @platform/auth · session — a pure, deterministic session state machine.
 *
 * No side effects, no I/O, and no ambient clock/RNG access (CLAUDE.md CS-3:
 * non-determinism is injected). This governs the client-side view of session
 * status only; the backend session is authoritative.
 */
import type { AuthErrorInfo, SessionSnapshot, SessionStatus } from './model';

export interface SessionState {
  readonly status: SessionStatus;
  readonly snapshot: SessionSnapshot | null;
  readonly error: AuthErrorInfo | null;
}

export const initialSessionState: SessionState = {
  status: 'UNAUTHENTICATED',
  snapshot: null,
  error: null,
};

export type SessionEvent =
  | { readonly type: 'LOGIN_STARTED' }
  | { readonly type: 'SESSION_ESTABLISHED'; readonly snapshot: SessionSnapshot }
  | { readonly type: 'SESSION_EXPIRED' }
  | { readonly type: 'LOGGED_OUT' }
  | { readonly type: 'AUTH_FAILED'; readonly error: AuthErrorInfo };

/** Deterministic transition function. */
export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'LOGIN_STARTED':
      return { status: 'AUTHENTICATING', snapshot: null, error: null };
    case 'SESSION_ESTABLISHED':
      return { status: 'AUTHENTICATED', snapshot: event.snapshot, error: null };
    case 'SESSION_EXPIRED':
      return { status: 'EXPIRED', snapshot: null, error: null };
    case 'LOGGED_OUT':
      return initialSessionState;
    case 'AUTH_FAILED':
      return { status: 'ERROR', snapshot: null, error: event.error };
    default:
      return state;
  }
}

export function isAuthenticated(state: SessionState): boolean {
  return state.status === 'AUTHENTICATED' && state.snapshot !== null;
}

/** Expiry check against an INJECTED clock (never `Date.now()` ambiently). */
export function isExpired(snapshot: SessionSnapshot, now: Date): boolean {
  return new Date(snapshot.expiresAt).getTime() <= now.getTime();
}
