/**
 * @platform/auth · model — authentication/authorization SHAPES.
 *
 * These mirror the contracts of the (Python) Authentication & Authorization
 * Foundation (`platform_security`) so the frontend speaks the same language.
 * They are inert type declarations: no protocol, no external identity provider,
 * no secrets. Identity is asserted by the governed backend, never minted here
 * (SEC-3). An AI `AGENT` identity is authority-capped and never `DECIDES`
 * (CLAUDE.md AI-1..4).
 */
import type { Id, Iso8601, Principal } from '@platform/types';

export type IdentityType = 'USER' | 'SERVICE' | 'AGENT';

/** Authority ceiling, mirroring the foundation. AI agents cap at PROPOSES. */
export type Authority = 'DECIDES' | 'PROPOSES' | 'NARRATES' | 'OBSERVES';

export interface Identity {
  readonly principal: Principal;
  readonly identityType: IdentityType;
  readonly authority: Authority;
  readonly displayName: string;
  readonly email?: string;
}

/** An immutable, backend-asserted view of the caller's current session. */
export interface SessionSnapshot {
  readonly identity: Identity;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly issuedAt: Iso8601;
  readonly expiresAt: Iso8601;
}

export type SessionStatus =
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'EXPIRED'
  | 'ERROR';

export interface AuthErrorInfo {
  readonly code: string;
  readonly message: string;
}

/** Credentials are user-entered and forwarded to the backend; never stored. */
export interface LoginInput {
  readonly username: string;
  readonly password: string;
}

/** Reference to the backend-issued, httpOnly session cookie. No token value
 *  is ever read by client JavaScript (SEC-3). */
export const SESSION_COOKIE = 'platform_session';

export type { Id, Iso8601 };
