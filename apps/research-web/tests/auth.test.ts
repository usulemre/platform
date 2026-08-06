import { describe, it, expect } from 'vitest';
import {
  can,
  evaluateRouteAccess,
  initialSessionState,
  sessionReducer,
  validateLoginInput,
  type RouteRule,
  type SessionSnapshot,
} from '@platform/auth';

const snapshot: SessionSnapshot = {
  identity: {
    principal: { id: 'u1', kind: 'USER', displayName: 'Ada' },
    identityType: 'USER',
    authority: 'PROPOSES',
    displayName: 'Ada',
  },
  roles: ['RESEARCHER'],
  permissions: ['research:read'],
  issuedAt: '2026-08-01T00:00:00.000Z',
  expiresAt: '2026-08-01T01:00:00.000Z',
};

const routes: RouteRule[] = [
  { prefix: '/login', access: 'public' },
  { prefix: '/admin', access: 'protected', requiresWorkflow: 'WFC-49' },
  { prefix: '/reports', access: 'protected', permissions: ['research:read'] },
  { prefix: '/', access: 'protected' },
];

describe('session state machine', () => {
  it('is deterministic across the lifecycle', () => {
    const authing = sessionReducer(initialSessionState, { type: 'LOGIN_STARTED' });
    expect(authing.status).toBe('AUTHENTICATING');
    const established = sessionReducer(authing, { type: 'SESSION_ESTABLISHED', snapshot });
    expect(established.status).toBe('AUTHENTICATED');
    expect(sessionReducer(established, { type: 'LOGGED_OUT' })).toEqual(initialSessionState);
  });
});

describe('advisory permission predicate', () => {
  it('reflects the snapshot and denies when absent', () => {
    expect(can(snapshot, 'research:read')).toBe(true);
    expect(can(snapshot, 'research:write')).toBe(false);
    expect(can(null, 'research:read')).toBe(false);
  });
});

describe('route guard', () => {
  it('allows public and bounces authenticated users off login', () => {
    expect(evaluateRouteAccess(routes, { path: '/login', hasSession: false }).kind).toBe('ALLOW');
    expect(evaluateRouteAccess(routes, { path: '/login', hasSession: true }).kind).toBe(
      'REDIRECT_TO_HOME',
    );
  });

  it('redirects unauthenticated protected access to login', () => {
    expect(evaluateRouteAccess(routes, { path: '/dashboard', hasSession: false }).kind).toBe(
      'REDIRECT_TO_LOGIN',
    );
  });

  it('requires a governed workflow when a route declares one', () => {
    const decision = evaluateRouteAccess(routes, { path: '/admin', hasSession: true });
    expect(decision.kind).toBe('REQUIRE_WORKFLOW');
    expect(decision.workflowRef).toBe('WFC-49');
  });

  it('forbids protected access without the advisory permission', () => {
    expect(
      evaluateRouteAccess(routes, { path: '/reports', hasSession: true, permissions: [] }).kind,
    ).toBe('FORBIDDEN');
    expect(
      evaluateRouteAccess(routes, {
        path: '/reports',
        hasSession: true,
        permissions: ['research:read'],
      }).kind,
    ).toBe('ALLOW');
  });
});

describe('validation-foundation integration', () => {
  it('flags missing username and short passwords', () => {
    const report = validateLoginInput({ username: '', password: 'short' });
    expect(report.valid).toBe(false);
    expect(report.issues.map((i) => i.field).sort()).toEqual(['password', 'username']);
  });

  it('passes well-formed input', () => {
    expect(validateLoginInput({ username: 'ada', password: 'longenough' }).valid).toBe(true);
  });
});
