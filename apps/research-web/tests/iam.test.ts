import { describe, it, expect } from 'vitest';
import {
  AccessControlService,
  MockIamRepository,
  IAM_SEED,
  accessibleApps,
  canAccessApp,
  hasAnyRole,
  resolveAccess,
  toUserProfileVm,
  type SessionSnapshot,
} from '@platform/auth';

const researcherSession: SessionSnapshot = {
  identity: {
    principal: { id: 'ada', kind: 'USER', displayName: 'Ada Researcher' },
    identityType: 'USER',
    authority: 'PROPOSES',
    displayName: 'Ada Researcher',
    email: 'ada@example.com',
  },
  roles: ['RESEARCHER'],
  permissions: ['app:research', 'research:read', 'research:propose'],
  issuedAt: '2026-08-02T00:00:00.000Z',
  expiresAt: '2026-08-02T01:00:00.000Z',
};

describe('application access resolution (pure)', () => {
  it('grants app access from the matching permission', () => {
    expect(canAccessApp(researcherSession.permissions, 'research-web')).toBe(true);
    expect(canAccessApp(researcherSession.permissions, 'admin-web')).toBe(false);
    expect(accessibleApps(researcherSession.permissions)).toEqual(['research-web']);
  });

  it('resolves role membership', () => {
    expect(hasAnyRole(researcherSession.roles, ['RESEARCHER', 'VIEWER'])).toBe(true);
    expect(hasAnyRole(researcherSession.roles, ['OPERATOR'])).toBe(false);
  });

  it('resolves access requirements against a session (advisory)', () => {
    expect(resolveAccess(null).kind).toBe('UNAUTHENTICATED');
    expect(resolveAccess(researcherSession, { permission: 'research:read' }).kind).toBe('ALLOW');
    expect(resolveAccess(researcherSession, { permission: 'agent:administer' }).kind).toBe(
      'FORBIDDEN',
    );
    expect(resolveAccess(researcherSession, { app: 'admin-web' }).kind).toBe('FORBIDDEN');
  });
});

describe('profile mapping (from session)', () => {
  it('derives a profile view model from the session snapshot', () => {
    const profile = toUserProfileVm(researcherSession);
    expect(profile.displayName).toBe('Ada Researcher');
    expect(profile.roles).toEqual(['RESEARCHER']);
    expect(profile.apps).toEqual(['research-web']);
    expect(profile.authority).toBe('PROPOSES');
  });
});

describe('AccessControlService (application layer over mock IAM repository)', () => {
  const service = new AccessControlService(new MockIamRepository());

  it('lists the identity directory as view models', async () => {
    expect((await service.listRoles()).length).toBe(IAM_SEED.roles.length);
    expect((await service.listPermissions()).length).toBe(IAM_SEED.permissions.length);
    expect((await service.listPolicies()).length).toBe(IAM_SEED.policies.length);
    expect((await service.listUsers()).length).toBe(IAM_SEED.users.length);
  });

  it('resolves the caller profile and access via the service', () => {
    expect(service.resolveProfile(null)).toBeNull();
    expect(service.resolveProfile(researcherSession)?.username).toBe('ada');
    expect(service.resolveAccess(researcherSession, { app: 'research-web' }).kind).toBe('ALLOW');
  });
});
