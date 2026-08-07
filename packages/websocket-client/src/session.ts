/**
 * `SessionManager` — tracks the logical session that spans a socket connection: its id, when it opened,
 * and whether it has authenticated. A new session is created on each (re)connect. Carries no secrets.
 */
export interface Session {
  readonly id: string;
  readonly openedAt: number;
  authenticated: boolean;
  authenticatedAt?: number;
}

export class SessionManager {
  private session?: Session;
  private counter = 0;

  /** Open a fresh session (called on connect). */
  open(now: number): Session {
    this.counter += 1;
    this.session = { id: `sess-${this.counter}`, openedAt: now, authenticated: false };
    return this.session;
  }

  /** Mark the current session authenticated. */
  authenticate(now: number): void {
    if (this.session) {
      this.session.authenticated = true;
      this.session.authenticatedAt = now;
    }
  }

  close(): void {
    this.session = undefined;
  }

  current(): Session | undefined {
    return this.session;
  }
  get id(): string | undefined {
    return this.session?.id;
  }
}
