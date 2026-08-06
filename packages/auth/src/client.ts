/**
 * @platform/auth · client — transport over the governed auth endpoints.
 *
 * NOT an identity provider and NOT a protocol implementation. It forwards
 * user-entered credentials to the backend and relies on the backend-issued
 * httpOnly session cookie, sent BY REFERENCE via `credentials: 'include'`.
 * No secrets or tokens are stored in client memory (SEC-3, FB-14).
 */
import type { ApiClient } from '@platform/api-client';
import type { LoginInput, SessionSnapshot } from './model';

export class AuthClient {
  constructor(private readonly api: ApiClient) {}

  /** Exchange credentials for a session; the backend sets the httpOnly cookie. */
  login(input: LoginInput): Promise<SessionSnapshot> {
    return this.api.request<SessionSnapshot>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      credentials: 'include',
    });
  }

  /** Invalidate the session; the backend clears the cookie. */
  logout(): Promise<void> {
    return this.api.request<void>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }

  /** Resolve the current session from the httpOnly cookie (read server-side). */
  session(): Promise<SessionSnapshot> {
    return this.api.request<SessionSnapshot>('/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
  }
}
