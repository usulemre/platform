/**
 * `AuthenticationStateManager` — the deterministic authentication lifecycle state machine. It tracks
 * the current {@link AuthenticationState}, enforces that only defined transitions occur, and emits an
 * {@link AuthenticationStateChangedEvent} on every change through an injected listener. The clock is
 * injected so emitted timestamps are deterministic. It DECIDES nothing about trading — it only reflects
 * the authenticated-session lifecycle.
 */
import type { AuthenticationState, AuthenticationStateChangedEvent } from './events';

export type AuthStateListener = (event: AuthenticationStateChangedEvent) => void;

/** Allowed transitions between authentication states. */
const TRANSITIONS: Readonly<Record<AuthenticationState, readonly AuthenticationState[]>> = {
  UNAUTHENTICATED: ['AUTHENTICATING', 'CLOSED'],
  AUTHENTICATING: ['AUTHENTICATED', 'FAILED', 'CLOSED'],
  AUTHENTICATED: ['EXPIRED', 'REAUTHENTICATING', 'FAILED', 'CLOSED'],
  EXPIRED: ['REAUTHENTICATING', 'CLOSED'],
  REAUTHENTICATING: ['AUTHENTICATED', 'FAILED', 'CLOSED'],
  FAILED: ['AUTHENTICATING', 'REAUTHENTICATING', 'CLOSED'],
  CLOSED: [],
};

export interface AuthenticationStateManagerDeps {
  readonly clock: () => number;
  readonly onChange?: AuthStateListener;
  readonly initial?: AuthenticationState;
}

export class AuthenticationStateManager {
  private current: AuthenticationState;
  private readonly clock: () => number;
  private readonly onChange?: AuthStateListener;

  constructor(deps: AuthenticationStateManagerDeps) {
    this.current = deps.initial ?? 'UNAUTHENTICATED';
    this.clock = deps.clock;
    this.onChange = deps.onChange;
  }

  /** The current authentication state. */
  get state(): AuthenticationState {
    return this.current;
  }

  /** Whether the session is currently authenticated. */
  get isAuthenticated(): boolean {
    return this.current === 'AUTHENTICATED';
  }

  /** Whether a transition to `next` is permitted from the current state. */
  canTransition(next: AuthenticationState): boolean {
    return TRANSITIONS[this.current].includes(next);
  }

  /**
   * Transition to `next` with a reason. Returns the emitted event, or `null` if the transition is not
   * permitted or is a no-op (idempotent).
   */
  transition(next: AuthenticationState, reason: string): AuthenticationStateChangedEvent | null {
    if (next === this.current) return null;
    if (!this.canTransition(next)) return null;
    const event: AuthenticationStateChangedEvent = {
      kind: 'authStateChanged',
      previous: this.current,
      current: next,
      reason,
      at: this.clock(),
    };
    this.current = next;
    this.onChange?.(event);
    return event;
  }
}
