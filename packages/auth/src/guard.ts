/**
 * @platform/auth · guard — a framework-neutral route-protection abstraction.
 *
 * This is the "authentication middleware abstraction": a pure decision function
 * over an abstract request. The Next.js middleware (and server layouts) adapt
 * their runtime request into `RouteRequest` and act on the returned decision.
 * Edge-safe: no React, no Node, no I/O.
 *
 * A protected route MAY be gated by a governed workflow (WFC ref), mirroring the
 * Admin API's workflow/counter-sign gating. The backend remains authoritative;
 * this only decides client-side navigation.
 */
export type AccessDecisionKind =
  | 'ALLOW'
  | 'REDIRECT_TO_LOGIN'
  | 'REDIRECT_TO_HOME'
  | 'REQUIRE_WORKFLOW'
  | 'FORBIDDEN';

export interface RouteRule {
  /** Path prefix this rule matches (`'/'` is the catch-all). */
  readonly prefix: string;
  readonly access: 'public' | 'protected';
  /** Permissions required for UX-level access (backend stays authoritative). */
  readonly permissions?: readonly string[];
  /** Governed workflow (WFC ref) that must authorize access, if any. */
  readonly requiresWorkflow?: string;
}

export interface RouteRequest {
  readonly path: string;
  readonly hasSession: boolean;
  readonly permissions?: readonly string[];
  readonly workflowAuthorized?: boolean;
}

export interface AccessDecision {
  readonly kind: AccessDecisionKind;
  readonly reason: string;
  readonly workflowRef?: string;
}

function isLoginPath(path: string): boolean {
  return path === '/login' || path.startsWith('/login/');
}

/** Longest-prefix match; `undefined` when nothing matches. */
export function matchRule(rules: readonly RouteRule[], path: string): RouteRule | undefined {
  const matches = rules.filter(
    (rule) => rule.prefix === '/' || path === rule.prefix || path.startsWith(`${rule.prefix}/`),
  );
  return [...matches].sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

export function evaluateRouteAccess(
  rules: readonly RouteRule[],
  request: RouteRequest,
): AccessDecision {
  const rule = matchRule(rules, request.path);

  // Public (or unmatched) routes: keep authenticated users off the login screen.
  if (!rule || rule.access === 'public') {
    if (request.hasSession && isLoginPath(request.path)) {
      return { kind: 'REDIRECT_TO_HOME', reason: 'already-authenticated' };
    }
    return { kind: 'ALLOW', reason: 'public' };
  }

  // Protected routes require a session.
  if (!request.hasSession) {
    return { kind: 'REDIRECT_TO_LOGIN', reason: 'no-session' };
  }

  // Optionally gated by a governed workflow authorization.
  if (rule.requiresWorkflow && !request.workflowAuthorized) {
    return {
      kind: 'REQUIRE_WORKFLOW',
      reason: 'workflow-authorization-required',
      workflowRef: rule.requiresWorkflow,
    };
  }

  // Optionally gated by advisory UX permissions.
  if (rule.permissions && rule.permissions.length > 0) {
    const held = new Set(request.permissions ?? []);
    const missing = rule.permissions.some((permission) => !held.has(permission));
    if (missing) {
      return { kind: 'FORBIDDEN', reason: 'insufficient-permissions' };
    }
  }

  return { kind: 'ALLOW', reason: 'authorized' };
}
